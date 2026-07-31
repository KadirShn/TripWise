import { useMemo } from 'react';
import { useTripData } from '@/features/data/use-trip-data';
import type { Id, TripBundle } from '@/types/domain';

export function useLocalTrip(tripId: Id): TripBundle | null {
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const members = data.members.filter((item) => item.tripId === tripId);
  const expenses = data.expenses.filter((item) => item.tripId === tripId);
  const itineraryItems = data.itineraryItems.filter((item) => item.tripId === tripId);
  return useMemo(
    () => (trip ? { trip, members, expenses, itineraryItems } : null),
    [trip, members, expenses, itineraryItems],
  );
}
