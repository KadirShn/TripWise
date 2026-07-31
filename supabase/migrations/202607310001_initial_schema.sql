create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'editor', 'viewer');
create type public.expense_split_method as enum ('equal', 'exact', 'percentage');
create type public.settlement_status as enum ('planned', 'paid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  avatar_url text,
  default_currency text not null default 'TRY' check (default_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  destination text not null check (char_length(destination) between 2 and 160),
  start_date date not null,
  end_date date not null,
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  budget_amount bigint check (budget_amount is null or budget_amount > 0),
  cover_emoji text not null default '✈️',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_order check (end_date >= start_date)
);

create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 100),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.member_role not null default 'editor',
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  paid_by_member_id uuid not null references public.trip_members(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  notes text,
  category text not null check (category in ('accommodation', 'transport', 'food', 'activity', 'shopping', 'other')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  exchange_rate_to_base numeric(20, 6) not null default 1 check (exchange_rate_to_base > 0),
  expense_date date not null,
  split_method public.expense_split_method not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  member_id uuid not null references public.trip_members(id) on delete restrict,
  share_minor bigint not null check (share_minor >= 0),
  percentage numeric(7, 4) check (percentage is null or percentage between 0 and 100),
  unique (expense_id, member_id)
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  notes text,
  location_name text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  estimated_cost_minor bigint check (estimated_cost_minor is null or estimated_cost_minor >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_time_order check (ends_at is null or ends_at >= starts_at)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_member_id uuid not null references public.trip_members(id) on delete restrict,
  to_member_id uuid not null references public.trip_members(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status public.settlement_status not null default 'planned',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint settlement_different_members check (from_member_id <> to_member_id),
  constraint settlement_paid_state check ((status = 'paid' and paid_at is not null) or (status = 'planned' and paid_at is null))
);

create index trips_owner_id_idx on public.trips(owner_id);
create index trip_members_trip_id_idx on public.trip_members(trip_id);
create index trip_members_user_id_idx on public.trip_members(user_id) where user_id is not null;
create index expenses_trip_date_idx on public.expenses(trip_id, expense_date desc);
create index expense_splits_expense_id_idx on public.expense_splits(expense_id);
create index itinerary_trip_start_idx on public.itinerary_items(trip_id, starts_at);
create index settlements_trip_id_idx on public.settlements(trip_id);

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trips_updated_at before update on public.trips for each row execute function public.set_updated_at();
create trigger expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger itinerary_updated_at before update on public.itinerary_items for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'Gezgin'), '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_trip_member(target_trip_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trips t where t.id = target_trip_id and t.owner_id = auth.uid()
    union all
    select 1 from public.trip_members tm where tm.trip_id = target_trip_id and tm.user_id = auth.uid()
  );
$$;

create function public.can_edit_trip(target_trip_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trips t where t.id = target_trip_id and t.owner_id = auth.uid()
    union all
    select 1 from public.trip_members tm where tm.trip_id = target_trip_id and tm.user_id = auth.uid() and tm.role in ('owner', 'editor')
  );
$$;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.settlements enable row level security;

create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy trips_select_members on public.trips for select using (public.is_trip_member(id));
create policy trips_select_owner on public.trips for select using (owner_id = auth.uid());
create policy trips_insert_owner on public.trips for insert with check (owner_id = auth.uid());
create policy trips_update_owner on public.trips for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy trips_delete_owner on public.trips for delete using (owner_id = auth.uid());

create policy members_select_trip on public.trip_members for select using (public.is_trip_member(trip_id));
create policy members_insert_editors on public.trip_members for insert with check (public.can_edit_trip(trip_id));
create policy members_update_editors on public.trip_members for update using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
create policy members_delete_editors on public.trip_members for delete using (public.can_edit_trip(trip_id));

create policy expenses_select_trip on public.expenses for select using (public.is_trip_member(trip_id));
create policy expenses_insert_editors on public.expenses for insert with check (public.can_edit_trip(trip_id) and created_by = auth.uid());
create policy expenses_update_editors on public.expenses for update using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
create policy expenses_delete_editors on public.expenses for delete using (public.can_edit_trip(trip_id));

create policy splits_select_trip on public.expense_splits for select using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)));
create policy splits_insert_editors on public.expense_splits for insert with check (exists (select 1 from public.expenses e where e.id = expense_id and public.can_edit_trip(e.trip_id)));
create policy splits_update_editors on public.expense_splits for update using (exists (select 1 from public.expenses e where e.id = expense_id and public.can_edit_trip(e.trip_id)));
create policy splits_delete_editors on public.expense_splits for delete using (exists (select 1 from public.expenses e where e.id = expense_id and public.can_edit_trip(e.trip_id)));

create policy itinerary_select_trip on public.itinerary_items for select using (public.is_trip_member(trip_id));
create policy itinerary_insert_editors on public.itinerary_items for insert with check (public.can_edit_trip(trip_id) and created_by = auth.uid());
create policy itinerary_update_editors on public.itinerary_items for update using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
create policy itinerary_delete_editors on public.itinerary_items for delete using (public.can_edit_trip(trip_id));

create policy settlements_select_trip on public.settlements for select using (public.is_trip_member(trip_id));
create policy settlements_insert_editors on public.settlements for insert with check (public.can_edit_trip(trip_id));
create policy settlements_update_editors on public.settlements for update using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
create policy settlements_delete_editors on public.settlements for delete using (public.can_edit_trip(trip_id));

grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.can_edit_trip(uuid) to authenticated;
