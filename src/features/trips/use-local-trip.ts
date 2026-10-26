import { useMemo } from 'react';
import { useTripData } from '@/features/data/use-trip-data';
import type { Id, MemberRole, TripBundle } from '@/types/domain';

export interface LocalTripResult {
  bundle: TripBundle | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  role: MemberRole;
  canEdit: boolean;
}

export function useLocalTrip(tripId: Id): LocalTripResult {
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const members = data.members.filter((item) => item.tripId === tripId);
  const expenses = data.expenses.filter((item) => item.tripId === tripId);
  const itineraryItems = data.itineraryItems.filter((item) => item.tripId === tripId);
  const settlements = data.settlements.filter((item) => item.tripId === tripId);
  const bundle = useMemo(
    () => (trip ? { trip, members, expenses, itineraryItems, settlements } : null),
    [trip, members, expenses, itineraryItems, settlements],
  );
  const role = data.myRole(tripId);
  return {
    bundle,
    isLoading: data.isLoading,
    error: data.error,
    refetch: data.refetch,
    role,
    canEdit: role !== 'viewer',
  };
}
