import { demoExpenses, demoItineraryItems, demoMembers, demoTrips } from '@/constants/demo-data';
import type { RemoteSnapshot } from '@/lib/supabase/trip-repository';
import { calculateBalances } from '@/utils/settlement/balances';
import { buildGuestTripImport } from './import-guest';

const snapshot: RemoteSnapshot = {
  trips: demoTrips,
  members: demoMembers,
  expenses: demoExpenses,
  itineraryItems: demoItineraryItems,
  settlements: [
    {
      id: 'local-settlement',
      tripId: demoTrips[0].id,
      fromMemberId: demoMembers[1].id,
      toMemberId: demoMembers[0].id,
      amountMinor: 1000,
      currency: 'TRY',
      status: 'paid',
      paidAt: '2026-09-15T10:00:00Z',
      createdAt: '2026-09-15T10:00:00Z',
    },
  ],
};

describe('guest trip import', () => {
  let counter = 0;
  const newId = () => `new-${++counter}`;
  beforeEach(() => {
    counter = 0;
  });

  it('copies every record with fresh ids and consistent references', () => {
    const plan = buildGuestTripImport(snapshot, demoTrips[0].id, newId);
    expect(plan).not.toBeNull();
    if (!plan) return;
    const oldIds = new Set([
      ...snapshot.trips.map((item) => item.id),
      ...snapshot.members.map((item) => item.id),
      ...snapshot.expenses.flatMap((item) => [item.id, ...item.splits.map((split) => split.id)]),
      ...snapshot.itineraryItems.map((item) => item.id),
    ]);
    const newIds = [
      plan.trip.id,
      plan.owner.id,
      ...plan.members.map((item) => item.id),
      ...plan.expenses.flatMap((item) => [item.id, ...item.splits.map((split) => split.id)]),
      ...plan.itineraryItems.map((item) => item.id),
      ...plan.settlements.map((item) => item.id),
    ];
    expect(newIds.some((id) => oldIds.has(id))).toBe(false);
    expect(new Set(newIds).size).toBe(newIds.length);

    const memberIds = new Set([plan.owner.id, ...plan.members.map((item) => item.id)]);
    for (const expense of plan.expenses) {
      expect(expense.tripId).toBe(plan.trip.id);
      expect(memberIds.has(expense.paidByMemberId)).toBe(true);
      expense.splits.forEach((split) => {
        expect(split.expenseId).toBe(expense.id);
        expect(memberIds.has(split.memberId)).toBe(true);
      });
    }
    expect(plan.members.every((item) => item.userId === null && item.role !== 'owner')).toBe(true);
    expect(plan.owner.role).toBe('owner');
  });

  it('preserves balances after remapping', () => {
    const plan = buildGuestTripImport(snapshot, demoTrips[0].id, newId);
    if (!plan) throw new Error('missing plan');
    const before = calculateBalances(
      snapshot.members.map((item) => item.id),
      snapshot.expenses,
      snapshot.settlements,
    ).map((item) => item.balanceMinor);
    const after = calculateBalances(
      [plan.owner.id, ...plan.members.map((item) => item.id)],
      plan.expenses,
      plan.settlements,
    ).map((item) => item.balanceMinor);
    expect(after.sort()).toEqual(before.sort());
  });

  it('returns null for an unknown trip', () => {
    expect(buildGuestTripImport(snapshot, 'missing', newId)).toBeNull();
  });
});
