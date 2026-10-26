import type { RemoteSnapshot } from '@/lib/supabase/trip-repository';
import type { Id, MemberRole, Trip, TripMember } from '@/types/domain';

export const emptySnapshot: RemoteSnapshot = {
  trips: [],
  members: [],
  expenses: [],
  itineraryItems: [],
  settlements: [],
};

/** Older persisted caches predate settlements; fill missing collections defensively. */
export const normalizeSnapshot = (
  snapshot: Partial<RemoteSnapshot> | undefined,
): RemoteSnapshot => ({
  trips: snapshot?.trips ?? [],
  members: snapshot?.members ?? [],
  expenses: snapshot?.expenses ?? [],
  itineraryItems: snapshot?.itineraryItems ?? [],
  settlements: snapshot?.settlements ?? [],
});

/** Replaces every record of one trip with a freshly fetched single-trip snapshot. */
export function mergeTripSnapshot(
  current: RemoteSnapshot,
  tripId: Id,
  fresh: RemoteSnapshot,
): RemoteSnapshot {
  const keep = <T extends { tripId: Id }>(items: T[]) =>
    items.filter((item) => item.tripId !== tripId);
  const trips = [...current.trips.filter((trip) => trip.id !== tripId), ...fresh.trips].sort(
    (a, b) => b.startDate.localeCompare(a.startDate) || a.id.localeCompare(b.id),
  );
  return {
    trips,
    members: [...keep(current.members), ...fresh.members],
    expenses: [...keep(current.expenses), ...fresh.expenses],
    itineraryItems: [...keep(current.itineraryItems), ...fresh.itineraryItems],
    settlements: [...keep(current.settlements), ...fresh.settlements],
  };
}

/** Mirrors the database `can_edit_trip` rule so the UI hides actions RLS would reject. */
export function resolveTripRole(
  trip: Pick<Trip, 'ownerId'> | undefined,
  members: Pick<TripMember, 'userId' | 'role'>[],
  userId: Id | undefined,
): MemberRole {
  if (!trip || !userId) return 'viewer';
  if (trip.ownerId === userId) return 'owner';
  return members.find((member) => member.userId === userId)?.role ?? 'viewer';
}
