-- TripWise integrity hardening. Safe to apply after the initial schema on
-- existing projects and included automatically by `supabase db push`.

do $$
begin
  if exists (
    select 1
    from public.expenses e
    join public.trip_members m on m.id = e.paid_by_member_id
    where m.trip_id <> e.trip_id
  ) then
    raise exception 'Cannot add expense payer integrity constraint: cross-trip payer data exists';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trip_members_id_trip_id_key'
      and conrelid = 'public.trip_members'::regclass
  ) then
    alter table public.trip_members
      add constraint trip_members_id_trip_id_key unique (id, trip_id);
  end if;
end;
$$;

alter table public.expenses
  drop constraint if exists expenses_paid_by_member_id_fkey;
alter table public.expenses
  drop constraint if exists expenses_paid_by_member_trip_fkey;
alter table public.expenses
  add constraint expenses_paid_by_member_trip_fkey
  foreign key (paid_by_member_id, trip_id)
  references public.trip_members (id, trip_id)
  on delete restrict;

create or replace function public.validate_expense_split_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expense_trip_id uuid;
  member_trip_id uuid;
begin
  select e.trip_id into expense_trip_id
  from public.expenses e
  where e.id = new.expense_id;

  select m.trip_id into member_trip_id
  from public.trip_members m
  where m.id = new.member_id;

  if expense_trip_id is null or member_trip_id is null or expense_trip_id <> member_trip_id then
    raise exception using
      errcode = '23514',
      message = 'Expense split member must belong to the expense trip';
  end if;
  return new;
end;
$$;

drop trigger if exists expense_split_membership_guard on public.expense_splits;
create trigger expense_split_membership_guard
before insert or update on public.expense_splits
for each row execute function public.validate_expense_split_membership();

create or replace function public.validate_settlement_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  from_trip_id uuid;
  to_trip_id uuid;
begin
  select m.trip_id into from_trip_id
  from public.trip_members m
  where m.id = new.from_member_id;

  select m.trip_id into to_trip_id
  from public.trip_members m
  where m.id = new.to_member_id;

  if from_trip_id is null or to_trip_id is null
     or from_trip_id <> new.trip_id or to_trip_id <> new.trip_id then
    raise exception using
      errcode = '23514',
      message = 'Settlement members must belong to the settlement trip';
  end if;
  return new;
end;
$$;

drop trigger if exists settlement_membership_guard on public.settlements;
create trigger settlement_membership_guard
before insert or update on public.settlements
for each row execute function public.validate_settlement_membership();

create or replace function public.validate_expense_split_totals()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_expense_id uuid := coalesce(new.expense_id, old.expense_id);
  expense_amount bigint;
  expense_method public.expense_split_method;
  share_total bigint;
  percentage_total numeric;
  split_count integer;
  percentage_count integer;
begin
  select e.amount_minor, e.split_method
  into expense_amount, expense_method
  from public.expenses e
  where e.id = target_expense_id;

  if not found then
    return null;
  end if;

  select coalesce(sum(s.share_minor), 0), coalesce(sum(s.percentage), 0),
         count(*), count(s.percentage)
  into share_total, percentage_total, split_count, percentage_count
  from public.expense_splits s
  where s.expense_id = target_expense_id;

  if split_count = 0 or share_total <> expense_amount then
    raise exception using
      errcode = '23514',
      message = 'Expense split shares must equal the expense amount';
  end if;

  if expense_method = 'percentage' then
    if percentage_count <> split_count or percentage_total <> 100 then
      raise exception using
        errcode = '23514',
        message = 'Percentage splits must total 100';
    end if;
  elsif percentage_count <> 0 then
    raise exception using
      errcode = '23514',
      message = 'Only percentage splits may include percentage values';
  end if;

  return null;
end;
$$;

drop trigger if exists expense_split_totals_guard on public.expense_splits;
create constraint trigger expense_split_totals_guard
after insert or update or delete on public.expense_splits
deferrable initially deferred
for each row execute function public.validate_expense_split_totals();

create or replace function public.validate_expense_has_splits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  split_row public.expense_splits%rowtype;
begin
  select * into split_row
  from public.expense_splits s
  where s.expense_id = new.id
  limit 1;

  if not found then
    raise exception using
      errcode = '23514',
      message = 'Expense must contain at least one split';
  end if;
  return new;
end;
$$;

drop trigger if exists expense_has_splits_guard on public.expenses;
create constraint trigger expense_has_splits_guard
after insert or update on public.expenses
deferrable initially deferred
for each row execute function public.validate_expense_has_splits();

create or replace function public.upsert_expense_with_splits(
  p_expense jsonb,
  p_splits jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_expense_id uuid := (p_expense ->> 'id')::uuid;
  target_trip_id uuid := (p_expense ->> 'trip_id')::uuid;
  target_amount bigint := (p_expense ->> 'amount_minor')::bigint;
  target_method public.expense_split_method := (p_expense ->> 'split_method')::public.expense_split_method;
  existing_trip_id uuid;
  split_count integer;
  distinct_member_count integer;
  share_total bigint;
  percentage_total numeric;
  percentage_count integer;
  valid_member_count integer;
begin
  if auth.uid() is null or not public.can_edit_trip(target_trip_id) then
    raise exception using errcode = '42501', message = 'Not allowed to edit this trip';
  end if;

  if jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception using errcode = '23514', message = 'At least one expense split is required';
  end if;

  select e.trip_id into existing_trip_id
  from public.expenses e
  where e.id = target_expense_id;
  if found and existing_trip_id <> target_trip_id then
    raise exception using errcode = '23514', message = 'Expense cannot be moved to another trip';
  end if;

  select count(*), count(distinct value ->> 'member_id'),
         sum((value ->> 'share_minor')::bigint),
         coalesce(sum((value ->> 'percentage')::numeric), 0),
         count(value ->> 'percentage')
  into split_count, distinct_member_count, share_total, percentage_total, percentage_count
  from jsonb_array_elements(p_splits);

  if split_count <> distinct_member_count or share_total <> target_amount then
    raise exception using errcode = '23514', message = 'Invalid or duplicate expense splits';
  end if;

  if target_method = 'percentage' then
    if percentage_count <> split_count or percentage_total <> 100 then
      raise exception using errcode = '23514', message = 'Percentage splits must total 100';
    end if;
  elsif percentage_count <> 0 then
    raise exception using errcode = '23514', message = 'Unexpected percentage values';
  end if;

  select count(*) into valid_member_count
  from public.trip_members m
  where m.trip_id = target_trip_id
    and m.id in (
      select (value ->> 'member_id')::uuid from jsonb_array_elements(p_splits)
    );
  if valid_member_count <> split_count then
    raise exception using errcode = '23514', message = 'All split members must belong to the trip';
  end if;

  insert into public.expenses (
    id, trip_id, created_by, paid_by_member_id, title, notes, category,
    amount_minor, currency, exchange_rate_to_base, expense_date, split_method
  ) values (
    target_expense_id,
    target_trip_id,
    auth.uid(),
    (p_expense ->> 'paid_by_member_id')::uuid,
    p_expense ->> 'title',
    nullif(p_expense ->> 'notes', ''),
    p_expense ->> 'category',
    target_amount,
    p_expense ->> 'currency',
    (p_expense ->> 'exchange_rate_to_base')::numeric,
    (p_expense ->> 'expense_date')::date,
    target_method
  )
  on conflict (id) do update set
    paid_by_member_id = excluded.paid_by_member_id,
    title = excluded.title,
    notes = excluded.notes,
    category = excluded.category,
    amount_minor = excluded.amount_minor,
    currency = excluded.currency,
    exchange_rate_to_base = excluded.exchange_rate_to_base,
    expense_date = excluded.expense_date,
    split_method = excluded.split_method;

  delete from public.expense_splits s where s.expense_id = target_expense_id;

  insert into public.expense_splits (id, expense_id, member_id, share_minor, percentage)
  select
    (value ->> 'id')::uuid,
    target_expense_id,
    (value ->> 'member_id')::uuid,
    (value ->> 'share_minor')::bigint,
    case when value ? 'percentage' and value ->> 'percentage' is not null
      then (value ->> 'percentage')::numeric else null end
  from jsonb_array_elements(p_splits);

  return target_expense_id;
end;
$$;

revoke execute on function public.upsert_expense_with_splits(jsonb, jsonb) from public;
revoke execute on function public.upsert_expense_with_splits(jsonb, jsonb) from anon;
grant execute on function public.upsert_expense_with_splits(jsonb, jsonb) to authenticated;
