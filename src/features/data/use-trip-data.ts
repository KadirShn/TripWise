import { randomUUID } from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DEMO_USER_ID } from '@/constants/demo-data';
import { useAuth } from '@/features/auth/auth-provider';
import { TripDataError } from '@/features/data/errors';
import { buildGuestTripImport } from '@/features/data/import-guest';
import {
  emptySnapshot,
  mergeTripSnapshot,
  normalizeSnapshot,
  resolveTripRole,
} from '@/features/data/snapshot';
import { i18n } from '@/lib/i18n';
import { remoteSnapshotQueryKey } from '@/lib/query/query-client';
import {
  acceptRemoteInvite,
  addRemoteItinerary,
  addRemoteMember,
  createRemoteInvite,
  createRemoteTrip,
  deleteRemoteExpense,
  deleteRemoteItinerary,
  deleteRemoteMember,
  deleteRemoteSettlement,
  deleteRemoteTrip,
  fetchRemoteSnapshot,
  fetchRemoteTripSnapshot,
  leaveRemoteTrip,
  previewRemoteInvite,
  recordRemoteSettlement,
  updateRemoteItinerary,
  updateRemoteMember,
  updateRemoteTrip,
  upsertRemoteExpense,
  type RemoteSnapshot,
} from '@/lib/supabase/trip-repository';
import { useAppStore, type NewSettlement } from '@/stores/app-store';
import type {
  Expense,
  Id,
  InvitePreview,
  ItineraryItem,
  MemberRole,
  Trip,
  TripInvite,
  TripMember,
} from '@/types/domain';

type NewTrip = Omit<Trip, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
type NewMember = Omit<TripMember, 'id' | 'createdAt'>;
type NewItinerary = Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>;
const now = () => new Date().toISOString();
const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected === false || state.isInternetReachable === false)
    throw new TripDataError('OFFLINE_MUTATION_DISABLED');
};
const requireAccount = (mode: string) => {
  if (mode !== 'authenticated') throw new TripDataError('ACCOUNT_REQUIRED');
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
    settlements: useAppStore((state) => state.settlements),
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
    recordSettlement: useAppStore((state) => state.recordSettlement),
    deleteSettlement: useAppStore((state) => state.deleteSettlement),
  };
  const clearLocalTrips = useAppStore((state) => state.clearLocalTrips);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: fetchRemoteSnapshot,
    enabled: mode === 'authenticated' && Boolean(userId),
  });
  const data = mode === 'authenticated' ? normalizeSnapshot(query.data ?? emptySnapshot) : local;
  const tripIdOf = (items: { id: Id; tripId: Id }[], id: Id) =>
    items.find((item) => item.id === id)?.tripId;

  // Refetch only the touched trip and merge it into the cached snapshot instead of
  // reloading every trip after each change.
  const refreshTrip = async (tripId: Id | undefined) => {
    const current = queryClient.getQueryData<RemoteSnapshot>(queryKey);
    if (!tripId || !current) {
      await queryClient.invalidateQueries({ queryKey });
      return;
    }
    const fresh = await fetchRemoteTripSnapshot(tripId);
    queryClient.setQueryData<RemoteSnapshot>(queryKey, (latest) =>
      mergeTripSnapshot(normalizeSnapshot(latest ?? current), tripId, fresh),
    );
  };

  const myRole = (tripId: Id): MemberRole =>
    mode !== 'authenticated'
      ? 'owner'
      : resolveTripRole(
          data.trips.find((item) => item.id === tripId),
          data.members.filter((member) => member.tripId === tripId),
          userId,
        );

  return {
    ...data,
    mode,
    userId,
    isLoading: mode === 'authenticated' && Boolean(userId) && query.isLoading,
    error: query.data ? null : query.error,
    refetch: query.refetch,
    myRole,
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
        displayName: i18n.t('participants.me'),
        email: null,
        role: 'owner',
        createdAt: timestamp,
      };
      await createRemoteTrip(trip, owner);
      await refreshTrip(id);
      return id;
    },
    updateTrip: async (tripId: Id, update: Partial<NewTrip>) => {
      if (mode !== 'authenticated') return localActions.updateTrip(tripId, update);
      await ensureOnline();
      await updateRemoteTrip(tripId, update);
      await refreshTrip(tripId);
    },
    deleteTrip: async (tripId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteTrip(tripId);
      await ensureOnline();
      await deleteRemoteTrip(tripId);
      await refreshTrip(tripId);
    },
    addMember: async (input: NewMember): Promise<Id> => {
      if (mode !== 'authenticated') return localActions.addMember(input);
      await ensureOnline();
      const member = await addRemoteMember({ ...input, id: randomUUID(), createdAt: now() });
      await refreshTrip(input.tripId);
      return member.id;
    },
    updateMember: async (memberId: Id, update: Partial<NewMember>) => {
      if (mode !== 'authenticated') return localActions.updateMember(memberId, update);
      await ensureOnline();
      await updateRemoteMember(memberId, update);
      await refreshTrip(tripIdOf(data.members, memberId));
    },
    deleteMember: async (memberId: Id) => {
      if (
        data.expenses.some(
          (expense) =>
            expense.paidByMemberId === memberId ||
            expense.splits.some((split) => split.memberId === memberId),
        ) ||
        data.settlements.some(
          (settlement) =>
            settlement.fromMemberId === memberId || settlement.toMemberId === memberId,
        )
      )
        throw new Error('MEMBER_IN_USE');
      if (mode !== 'authenticated') return localActions.deleteMember(memberId);
      await ensureOnline();
      const tripId = tripIdOf(data.members, memberId);
      await deleteRemoteMember(memberId);
      await refreshTrip(tripId);
    },
    upsertExpense: async (expense: Expense) => {
      if (mode !== 'authenticated') return localActions.upsertExpense(expense);
      await ensureOnline();
      await upsertRemoteExpense(expense);
      await refreshTrip(expense.tripId);
    },
    deleteExpense: async (expenseId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteExpense(expenseId);
      await ensureOnline();
      const tripId = tripIdOf(data.expenses, expenseId);
      await deleteRemoteExpense(expenseId);
      await refreshTrip(tripId);
    },
    addItineraryItem: async (input: NewItinerary): Promise<Id> => {
      if (mode !== 'authenticated') return localActions.addItineraryItem(input);
      await ensureOnline();
      const id = randomUUID();
      const timestamp = now();
      await addRemoteItinerary({ ...input, id, createdAt: timestamp, updatedAt: timestamp });
      await refreshTrip(input.tripId);
      return id;
    },
    updateItineraryItem: async (itemId: Id, update: Partial<NewItinerary>) => {
      if (mode !== 'authenticated') return localActions.updateItineraryItem(itemId, update);
      await ensureOnline();
      await updateRemoteItinerary(itemId, update);
      await refreshTrip(tripIdOf(data.itineraryItems, itemId));
    },
    deleteItineraryItem: async (itemId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteItineraryItem(itemId);
      await ensureOnline();
      const tripId = tripIdOf(data.itineraryItems, itemId);
      await deleteRemoteItinerary(itemId);
      await refreshTrip(tripId);
    },
    recordSettlement: async (input: NewSettlement): Promise<Id> => {
      if (mode !== 'authenticated') return localActions.recordSettlement(input);
      await ensureOnline();
      const id = randomUUID();
      const timestamp = now();
      await recordRemoteSettlement({
        ...input,
        id,
        status: 'paid',
        paidAt: timestamp,
        createdAt: timestamp,
      });
      await refreshTrip(input.tripId);
      return id;
    },
    deleteSettlement: async (settlementId: Id) => {
      if (mode !== 'authenticated') return localActions.deleteSettlement(settlementId);
      await ensureOnline();
      const tripId = tripIdOf(data.settlements, settlementId);
      await deleteRemoteSettlement(settlementId);
      await refreshTrip(tripId);
    },
    createInvite: async (tripId: Id, role: TripInvite['role']): Promise<TripInvite> => {
      requireAccount(mode);
      await ensureOnline();
      return createRemoteInvite(tripId, role);
    },
    previewInvite: async (code: string): Promise<InvitePreview> => {
      requireAccount(mode);
      await ensureOnline();
      return previewRemoteInvite(code);
    },
    acceptInvite: async (code: string, memberId: Id | null): Promise<Id> => {
      requireAccount(mode);
      await ensureOnline();
      const tripId = await acceptRemoteInvite(code, memberId);
      await refreshTrip(tripId);
      return tripId;
    },
    leaveTrip: async (tripId: Id) => {
      requireAccount(mode);
      await ensureOnline();
      await leaveRemoteTrip(tripId);
      await refreshTrip(tripId);
    },
    /** Demo trips still on this device after signing in; offered for import. */
    guestTrips: mode === 'authenticated' ? local.trips : [],
    importGuestTrips: async (): Promise<number> => {
      requireAccount(mode);
      await ensureOnline();
      let imported = 0;
      try {
        for (const localTrip of local.trips) {
          const plan = buildGuestTripImport(local, localTrip.id, randomUUID);
          if (!plan) continue;
          await createRemoteTrip(plan.trip, plan.owner);
          try {
            for (const member of plan.members) await addRemoteMember(member);
            for (const expense of plan.expenses) await upsertRemoteExpense(expense);
            for (const item of plan.itineraryItems) await addRemoteItinerary(item);
            for (const settlement of plan.settlements) await recordRemoteSettlement(settlement);
          } catch (error) {
            // Never leave a half-copied trip in the account; the local copy stays intact.
            await deleteRemoteTrip(plan.trip.id).catch(() => undefined);
            throw error;
          }
          // Remove each copied trip locally right away so a later failure cannot duplicate it.
          await localActions.deleteTrip(localTrip.id);
          imported += 1;
        }
      } finally {
        if (imported) await queryClient.invalidateQueries({ queryKey });
      }
      return imported;
    },
    discardGuestTrips: () => clearLocalTrips(),
  };
}
