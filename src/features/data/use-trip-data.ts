import { randomUUID } from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DEMO_USER_ID } from '@/constants/demo-data';
import { useAuth } from '@/features/auth/auth-provider';
import { TripDataError } from '@/features/data/errors';
import { remoteSnapshotQueryKey } from '@/lib/query/query-client';
import {
  addRemoteItinerary,
  addRemoteMember,
  createRemoteTrip,
  deleteRemoteExpense,
  deleteRemoteItinerary,
  deleteRemoteMember,
  deleteRemoteTrip,
  fetchRemoteSnapshot,
  updateRemoteItinerary,
  updateRemoteMember,
  updateRemoteTrip,
  upsertRemoteExpense,
  type RemoteSnapshot,
} from '@/lib/supabase/trip-repository';
import { useAppStore } from '@/stores/app-store';
import type { Expense, Id, ItineraryItem, Trip, TripMember } from '@/types/domain';

type NewTrip = Omit<Trip, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
type NewMember = Omit<TripMember, 'id' | 'createdAt'>;
type NewItinerary = Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>;
const empty: RemoteSnapshot = { trips: [], members: [], expenses: [], itineraryItems: [] };
const now = () => new Date().toISOString();
const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected === false || state.isInternetReachable === false)
    throw new TripDataError('OFFLINE_MUTATION_DISABLED');
};

export function useTripData() {
  const mode = useAppStore((state) => state.mode);
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryKey = remoteSnapshotQueryKey(userId ?? 'signed-out');
  const local: RemoteSnapshot = {
    trips: useAppStore((state) => state.trips),
    members: useAppStore((state) => state.members),
    expenses: useAppStore((state) => state.expenses),
    itineraryItems: useAppStore((state) => state.itineraryItems),
  };
  const localActions = {
    createTrip: useAppStore((state) => state.createTrip),
    updateTrip: useAppStore((state) => state.updateTrip),
    deleteTrip: useAppStore((state) => state.deleteTrip),
    addMember: useAppStore((state) => state.addMember),
    updateMember: useAppStore((state) => state.updateMember),
    deleteMember: useAppStore((state) => state.deleteMember),
    upsertExpense: useAppStore((state) => state.upsertExpense),
    deleteExpense: useAppStore((state) => state.deleteExpense),
    addItineraryItem: useAppStore((state) => state.addItineraryItem),
    updateItineraryItem: useAppStore((state) => state.updateItineraryItem),
    deleteItineraryItem: useAppStore((state) => state.deleteItineraryItem),
  };
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: fetchRemoteSnapshot,
    enabled: mode === 'authenticated' && Boolean(userId),
  });
  const data = mode === 'authenticated' ? (query.data ?? empty) : local;
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    ...data,
    isLoading: mode === 'authenticated' && Boolean(userId) && query.isLoading,
    error: query.data ? null : query.error,
    refetch: query.refetch,
    createTrip: async (input: NewTrip): Promise<Id> => {
      if (mode !== 'authenticated') return localActions.createTrip(input);
      await ensureOnline();
      const id = randomUUID();
      const timestamp = now();
      const trip: Trip = {
        ...input,
        id,
        ownerId: DEMO_USER_ID,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const owner: TripMember = {
        id: randomUUID(),
        tripId: id,
        userId: DEMO_USER_ID,
        displayName: 'Ben',
        email: null,
        role: 'owner',
        createdAt: timestamp,
      };
      await createRemoteTrip(trip, owner);
      await refresh();
      return id;
    },
    updateTrip: async (tripId: Id, update: Partial<NewTrip>) => {
      if (mode !== 'authenticated') return localActions.updateTrip(tripId, update);
      await ensureOnline();
      await updateRemoteTrip(tripId, update);
      await refresh();
    },
    deleteTrip: async (tripId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteTrip(tripId);
      await ensureOnline();
      await deleteRemoteTrip(tripId);
      await refresh();
    },
    addMember: async (input: NewMember): Promise<Id> => {
      if (mode !== 'authenticated') return localActions.addMember(input);
      await ensureOnline();
      const member = await addRemoteMember({ ...input, id: randomUUID(), createdAt: now() });
      await refresh();
      return member.id;
    },
    updateMember: async (memberId: Id, update: Partial<NewMember>) => {
      if (mode !== 'authenticated') return localActions.updateMember(memberId, update);
      await ensureOnline();
      await updateRemoteMember(memberId, update);
      await refresh();
    },
    deleteMember: async (memberId: Id) => {
      if (
        data.expenses.some(
          (expense) =>
            expense.paidByMemberId === memberId ||
            expense.splits.some((split) => split.memberId === memberId),
        )
      )
        throw new Error('MEMBER_IN_USE');
      if (mode !== 'authenticated') return localActions.deleteMember(memberId);
      await ensureOnline();
      await deleteRemoteMember(memberId);
      await refresh();
    },
    upsertExpense: async (expense: Expense) => {
      if (mode !== 'authenticated') return localActions.upsertExpense(expense);
      await ensureOnline();
      await upsertRemoteExpense(expense);
      await refresh();
    },
    deleteExpense: async (expenseId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteExpense(expenseId);
      await ensureOnline();
      await deleteRemoteExpense(expenseId);
      await refresh();
    },
    addItineraryItem: async (input: NewItinerary): Promise<Id> => {
      if (mode !== 'authenticated') return localActions.addItineraryItem(input);
      await ensureOnline();
      const id = randomUUID();
      const timestamp = now();
      await addRemoteItinerary({ ...input, id, createdAt: timestamp, updatedAt: timestamp });
      await refresh();
      return id;
    },
    updateItineraryItem: async (itemId: Id, update: Partial<NewItinerary>) => {
      if (mode !== 'authenticated') return localActions.updateItineraryItem(itemId, update);
      await ensureOnline();
      await updateRemoteItinerary(itemId, update);
      await refresh();
    },
    deleteItineraryItem: async (itemId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteItineraryItem(itemId);
      await ensureOnline();
      await deleteRemoteItinerary(itemId);
      await refresh();
    },
  };
}
