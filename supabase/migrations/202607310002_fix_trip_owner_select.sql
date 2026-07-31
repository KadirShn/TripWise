-- Owners must be able to read a newly inserted trip in the same
-- PostgREST request when `.insert(...).select()` returns the row.
drop policy if exists trips_select_owner on public.trips;

create policy trips_select_owner
on public.trips
for select
using (owner_id = auth.uid());
