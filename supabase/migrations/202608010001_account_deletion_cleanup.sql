-- Makes account deletion deterministic even when the user contributed to a
-- trip owned by someone else. The function runs as the authenticated caller
-- and removes or anonymizes only that caller's data before Auth deletion.

create or replace function public.prepare_account_deletion()
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

  -- Owned trips cascade to their participants, expenses, splits, itinerary,
  -- and settlements through the schema's foreign keys.
  delete from public.trips t where t.owner_id = target_user_id;

  -- Contributions inside trips owned by other users should not prevent the
  -- Auth user from being deleted.
  delete from public.expenses e where e.created_by = target_user_id;
  delete from public.itinerary_items i where i.created_by = target_user_id;

  -- Preserve other owners' financial history while removing the deleted
  -- user's identity from participant rows referenced by splits/settlements.
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
