import { useMemo } from 'react';
import { useTripData } from '@/features/data/use-trip-data';
import type { Id, TripBundle } from '@/types/domain';

export interface LocalTripResult {
  bundle: TripBundle | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useLocalTrip(tripId: Id): LocalTripResult {
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const members = data.members.filter((item) => item.tripId === tripId);
  const expenses = data.expenses.filter((item) => item.tripId === tripId);
  const itineraryItems = data.itineraryItems.filter((item) => item.tripId === tripId);
  const bundle = useMemo(
    () => (trip ? { trip, members, expenses, itineraryItems } : null),
    [trip, members, expenses, itineraryItems],
  );
  return {
    bundle,
    isLoading: data.isLoading,
    error: data.error,
    refetch: data.refetch,
  };
}
