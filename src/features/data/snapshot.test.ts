import type { RemoteSnapshot } from '@/lib/supabase/trip-repository';
import type { Trip, TripMember } from '@/types/domain';
import { mergeTripSnapshot, normalizeSnapshot, resolveTripRole } from './snapshot';

const trip = (id: string, startDate: string): Trip => ({
  id,
  ownerId: 'owner',
  title: id,
  destination: 'Test',
  startDate,
  endDate: startDate,
  baseCurrency: 'TRY',
  budgetAmountMinor: null,
  coverEmoji: '✈️',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});
const member = (id: string, tripId: string, patch: Partial<TripMember> = {}): TripMember => ({
  id,
  tripId,
  userId: null,
  displayName: id,
  email: null,
  role: 'editor',
  createdAt: '2026-01-01T00:00:00Z',
  ...patch,
});

describe('trip snapshot helpers', () => {
  it('fills collections missing from caches persisted by older app versions', () => {
    expect(normalizeSnapshot({ trips: [trip('a', '2026-01-01')] }).settlements).toEqual([]);
    expect(normalizeSnapshot(undefined).trips).toEqual([]);
  });

  it('replaces only the refreshed trip and keeps the newest trips first', () => {
    const current: RemoteSnapshot = {
      trips: [trip('b', '2026-05-01'), trip('a', '2026-01-01')],
      members: [member('a1', 'a'), member('b1', 'b')],
      expenses: [],
      itineraryItems: [],
      settlements: [],
    };
    const fresh: RemoteSnapshot = {
      trips: [{ ...trip('a', '2026-09-01'), title: 'Updated' }],
      members: [member('a2', 'a')],
      expenses: [],
      itineraryItems: [],
      settlements: [],
    };
    const merged = mergeTripSnapshot(current, 'a', fresh);
    expect(merged.trips.map((item) => item.title)).toEqual(['Updated', 'b']);
    expect(merged.members.map((item) => item.id).sort()).toEqual(['a2', 'b1']);
  });

  it('drops a trip that no longer exists or is no longer visible', () => {
    const current: RemoteSnapshot = {
      trips: [trip('a', '2026-01-01')],
      members: [member('a1', 'a')],
      expenses: [],
      itineraryItems: [],
      settlements: [],
    };
    const merged = mergeTripSnapshot(current, 'a', normalizeSnapshot(undefined));
    expect(merged.trips).toEqual([]);
    expect(merged.members).toEqual([]);
  });

  it('resolves the current user role like the database helper', () => {
    const members = [member('m1', 'a', { userId: 'viewer-user', role: 'viewer' })];
    expect(resolveTripRole(trip('a', '2026-01-01'), members, 'owner')).toBe('owner');
    expect(resolveTripRole(trip('a', '2026-01-01'), members, 'viewer-user')).toBe('viewer');
    expect(resolveTripRole(trip('a', '2026-01-01'), members, 'stranger')).toBe('viewer');
    expect(resolveTripRole(undefined, members, 'owner')).toBe('viewer');
  });
});
