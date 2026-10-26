import type { RemoteSnapshot } from '@/lib/supabase/trip-repository';
import type { Expense, Id, ItineraryItem, Settlement, Trip, TripMember } from '@/types/domain';

export interface GuestTripImport {
  trip: Trip;
  owner: TripMember;
  members: TripMember[];
  expenses: Expense[];
  itineraryItems: ItineraryItem[];
  settlements: Settlement[];
}

/**
 * Copies one local trip with fresh ids. Demo seed ids are identical on every device,
 * so reusing them would collide in the shared database.
 */
export function buildGuestTripImport(
  snapshot: RemoteSnapshot,
  tripId: Id,
  newId: () => Id,
): GuestTripImport | null {
  const sourceTrip = snapshot.trips.find((trip) => trip.id === tripId);
  if (!sourceTrip) return null;
  const sourceMembers = snapshot.members.filter((member) => member.tripId === tripId);
  const sourceOwner =
    sourceMembers.find((member) => member.role === 'owner') ?? sourceMembers[0] ?? null;
  const tripIdNew = newId();
  const memberIds = new Map(sourceMembers.map((member) => [member.id, newId()]));
  const mapMember = (id: Id) => {
    const mapped = memberIds.get(id);
    if (!mapped) throw new Error('IMPORT_MEMBER_MISSING');
    return mapped;
  };
  const trip: Trip = { ...sourceTrip, id: tripIdNew };
  const owner: TripMember = sourceOwner
    ? { ...sourceOwner, id: mapMember(sourceOwner.id), tripId: tripIdNew, role: 'owner' }
    : {
        id: newId(),
        tripId: tripIdNew,
        userId: null,
        displayName: '—',
        email: null,
        role: 'owner',
        createdAt: sourceTrip.createdAt,
      };
  const members = sourceMembers
    .filter((member) => member.id !== sourceOwner?.id)
    .map((member) => ({
      ...member,
      id: mapMember(member.id),
      tripId: tripIdNew,
      userId: null,
      role: member.role === 'owner' ? ('editor' as const) : member.role,
    }));
  const expenses = snapshot.expenses
    .filter((expense) => expense.tripId === tripId)
    .map((expense) => {
      const expenseId = newId();
      return {
        ...expense,
        id: expenseId,
        tripId: tripIdNew,
        paidByMemberId: mapMember(expense.paidByMemberId),
        splits: expense.splits.map((split) => ({
          ...split,
          id: newId(),
          expenseId,
          memberId: mapMember(split.memberId),
        })),
      };
    });
  const itineraryItems = snapshot.itineraryItems
    .filter((item) => item.tripId === tripId)
    .map((item) => ({ ...item, id: newId(), tripId: tripIdNew }));
  const settlements = snapshot.settlements
    .filter((settlement) => settlement.tripId === tripId)
    .map((settlement) => ({
      ...settlement,
      id: newId(),
      tripId: tripIdNew,
      fromMemberId: mapMember(settlement.fromMemberId),
      toMemberId: mapMember(settlement.toMemberId),
    }));
  return { trip, owner, members, expenses, itineraryItems, settlements };
}
