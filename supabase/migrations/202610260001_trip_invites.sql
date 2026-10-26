-- TripWise 1.1: invite codes, joining and leaving trips, and membership hardening.
-- Safe to apply on existing projects with `supabase db push`.

-- 1. Expenses and itinerary items created by a member who later deletes their
--    account must stay in other people's trips, so the author becomes nullable.
alter table public.expenses alter column created_by drop not null;
alter table public.expenses drop constraint if exists expenses_created_by_fkey;
alter table public.expenses
  add constraint expenses_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.itinerary_items alter column created_by drop not null;
alter table public.itinerary_items drop constraint if exists itinerary_items_created_by_fkey;
alter table public.itinerary_items
  add constraint itinerary_items_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- 2. Invite codes. Rows are only created through `create_trip_invite`.
create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  role public.member_role not null default 'editor' check (role <> 'owner'),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days',
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trip_invites_trip_id_idx on public.trip_invites(trip_id);

alter table public.trip_invites enable row level security;

drop policy if exists invites_select_editors on public.trip_invites;
create policy invites_select_editors on public.trip_invites
  for select using (public.can_edit_trip(trip_id));
drop policy if exists invites_delete_editors on public.trip_invites;
create policy invites_delete_editors on public.trip_invites
  for delete using (public.can_edit_trip(trip_id));

-- 3. Membership hardening. Linking a member row to an account is only possible
--    through the invite RPC, and the owner row cannot be edited or removed by editors.
drop policy if exists members_insert_editors on public.trip_members;
create policy members_insert_editors on public.trip_members
  for insert with check (
    public.can_edit_trip(trip_id)
    and (user_id is null or user_id = auth.uid())
    and (
      role <> 'owner'
      or exists (
        select 1 from public.trips t
        where t.id = trip_id and t.owner_id = auth.uid() and user_id = auth.uid()
      )
    )
  );

drop policy if exists members_update_editors on public.trip_members;
create policy members_update_editors on public.trip_members
  for update
  using (public.can_edit_trip(trip_id) and role <> 'owner')
  with check (public.can_edit_trip(trip_id) and role <> 'owner');

drop policy if exists members_delete_editors on public.trip_members;
create policy members_delete_editors on public.trip_members
  for delete using (public.can_edit_trip(trip_id) and role <> 'owner');

revoke update on public.trip_members from anon, authenticated;
grant update (display_name, email, role) on public.trip_members to authenticated;

-- 4. Invite RPCs.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea := uuid_send(gen_random_uuid());
  -- Bytes 6 and 8 of a v4 UUID carry version/variant bits; skip them.
  byte_positions constant integer[] := array[0, 1, 2, 3, 4, 5, 9, 10];
  result text := '';
  byte_index integer;
begin
  foreach byte_index in array byte_positions loop
    result := result || substr(alphabet, (get_byte(random_bytes, byte_index) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

revoke execute on function public.generate_invite_code() from public, anon, authenticated;

create or replace function public.create_trip_invite(
  p_trip_id uuid,
  p_role public.member_role default 'editor'
)
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  target_user_id uuid := auth.uid();
  new_code text;
  attempts integer := 0;
begin
  if target_user_id is null or not public.can_edit_trip(p_trip_id) then
    raise exception using errcode = '42501', message = 'INVITE_NOT_ALLOWED';
  end if;
  if p_role = 'owner' then
    raise exception using errcode = '23514', message = 'INVITE_ROLE_INVALID';
  end if;

  loop
    attempts := attempts + 1;
    new_code := public.generate_invite_code();
    begin
      insert into public.trip_invites (trip_id, code, role, created_by)
      values (p_trip_id, new_code, p_role, target_user_id);
      exit;
    exception when unique_violation then
      if attempts >= 5 then raise; end if;
    end;
  end loop;

  return query
  select i.code, i.expires_at from public.trip_invites i where i.code = new_code;
end;
$$;

revoke execute on function public.create_trip_invite(uuid, public.member_role) from public, anon;
grant execute on function public.create_trip_invite(uuid, public.member_role) to authenticated;

create or replace function public.get_invite_preview(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
  invite record;
begin
  if target_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select i.trip_id, i.role, t.title, t.destination, t.cover_emoji, t.owner_id
  into invite
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  where i.code = upper(trim(p_code))
    and i.revoked_at is null
    and i.expires_at > now();

  if not found then
    raise exception using errcode = 'P0002', message = 'INVITE_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'trip_id', invite.trip_id,
    'trip_title', invite.title,
    'destination', invite.destination,
    'cover_emoji', invite.cover_emoji,
    'role', invite.role,
    'already_member', invite.owner_id = target_user_id or exists (
      select 1 from public.trip_members m
      where m.trip_id = invite.trip_id and m.user_id = target_user_id
    ),
    'unclaimed_members', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'display_name', m.display_name)
                       order by m.created_at, m.id)
      from public.trip_members m
      where m.trip_id = invite.trip_id and m.user_id is null and m.role <> 'owner'
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.get_invite_preview(text) from public, anon;
grant execute on function public.get_invite_preview(text) to authenticated;

create or replace function public.accept_trip_invite(p_code text, p_member_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
  target_email text;
  target_name text;
  invite record;
  claimed_id uuid;
begin
  if target_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select i.trip_id, i.role, t.owner_id
  into invite
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  where i.code = upper(trim(p_code))
    and i.revoked_at is null
    and i.expires_at > now();

  if not found then
    raise exception using errcode = 'P0002', message = 'INVITE_NOT_FOUND';
  end if;

  -- Joining twice is a no-op so a re-opened link simply opens the trip.
  if invite.owner_id = target_user_id or exists (
    select 1 from public.trip_members m
    where m.trip_id = invite.trip_id and m.user_id = target_user_id
  ) then
    return invite.trip_id;
  end if;

  select u.email into target_email from auth.users u where u.id = target_user_id;

  if p_member_id is not null then
    update public.trip_members m
    set user_id = target_user_id,
        email = coalesce(target_email, m.email),
        role = invite.role
    where m.id = p_member_id
      and m.trip_id = invite.trip_id
      and m.user_id is null
      and m.role <> 'owner'
    returning m.id into claimed_id;

    if claimed_id is null then
      raise exception using errcode = '23514', message = 'INVITE_MEMBER_UNAVAILABLE';
    end if;
  else
    select coalesce(nullif(trim(p.display_name), ''), split_part(target_email, '@', 1), 'TripWise')
    into target_name
    from public.profiles p
    where p.id = target_user_id;

    insert into public.trip_members (trip_id, user_id, display_name, email, role)
    values (
      invite.trip_id,
      target_user_id,
      left(coalesce(target_name, split_part(target_email, '@', 1), 'TripWise'), 100),
      target_email,
      invite.role
    );
  end if;

  return invite.trip_id;
end;
$$;

revoke execute on function public.accept_trip_invite(text, uuid) from public, anon;
grant execute on function public.accept_trip_invite(text, uuid) to authenticated;

create or replace function public.leave_trip(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
begin
  if target_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if exists (select 1 from public.trips t where t.id = p_trip_id and t.owner_id = target_user_id) then
    raise exception using errcode = '42501', message = 'OWNER_CANNOT_LEAVE';
  end if;

  -- Keep the participant row so existing expenses and balances stay intact.
  update public.trip_members m
  set user_id = null, email = null
  where m.trip_id = p_trip_id and m.user_id = target_user_id;
end;
$$;

revoke execute on function public.leave_trip(uuid) from public, anon;
grant execute on function public.leave_trip(uuid) to authenticated;

-- 5. Account deletion keeps shared data in trips owned by other people. Expense and
--    itinerary authors are set to null by the foreign keys when the auth user is removed.
create or replace function public.prepare_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
  owned_trip record;
begin
  if target_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  for owned_trip in
    select t.id from public.trips t where t.owner_id = target_user_id
  loop
    perform public.delete_owned_trip(owned_trip.id);
  end loop;

  delete from public.trip_invites i where i.created_by = target_user_id;

  update public.trip_members m
  set user_id = null,
      email = null,
      display_name = 'Silinmiş kullanıcı'
  where m.user_id = target_user_id;
end;
$$;

revoke execute on function public.prepare_account_deletion() from public;
revoke execute on function public.prepare_account_deletion() from anon;
grant execute on function public.prepare_account_deletion() to authenticated;

-- 6. Trip deletion also removes invite codes before members.
create or replace function public.delete_owned_trip(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
begin
  if target_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.trips t
    where t.id = p_trip_id and t.owner_id = target_user_id
  ) then
    raise exception using errcode = '42501', message = 'Only the trip owner can delete this trip';
  end if;

  delete from public.trip_invites i where i.trip_id = p_trip_id;
  delete from public.settlements s where s.trip_id = p_trip_id;
  delete from public.expense_splits s
  where exists (
    select 1 from public.expenses e
    where e.id = s.expense_id and e.trip_id = p_trip_id
  );
  delete from public.expenses e where e.trip_id = p_trip_id;
  delete from public.itinerary_items i where i.trip_id = p_trip_id;
  delete from public.trip_members m where m.trip_id = p_trip_id;
  delete from public.trips t where t.id = p_trip_id;
end;
$$;

revoke execute on function public.delete_owned_trip(uuid) from public;
revoke execute on function public.delete_owned_trip(uuid) from anon;
grant execute on function public.delete_owned_trip(uuid) to authenticated;
