-- Delete an owned trip in dependency order without weakening member foreign keys.
-- A PostgreSQL ON DELETE RESTRICT constraint can otherwise reject the trip's
-- cascading member deletion while expenses still reference their payer.

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

  delete from public.expenses e where e.created_by = target_user_id;
  delete from public.itinerary_items i where i.created_by = target_user_id;

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
