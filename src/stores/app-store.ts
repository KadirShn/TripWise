import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  demoExpenses,
  demoItineraryItems,
  demoMembers,
  demoTrips,
  DEMO_USER_ID,
} from '@/constants/demo-data';
import { i18n } from '@/lib/i18n';
import type { Expense, Id, ItineraryItem, Settlement, Trip, TripMember } from '@/types/domain';
import type { ThemePreference } from '@/theme/theme';
import { appLocalStorage } from '@/lib/storage/local-storage';

export type AppMode = 'none' | 'guest' | 'authenticated';
export type AppLanguage = 'tr' | 'en';
type NewTrip = Omit<Trip, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
type NewMember = Omit<TripMember, 'id' | 'createdAt'>;
type NewItinerary = Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>;
export type NewSettlement = Omit<Settlement, 'id' | 'createdAt' | 'status' | 'paidAt'>;

interface AppState {
  hasHydrated: boolean;
  onboardingCompleted: boolean;
  mode: AppMode;
  // Last signed-in user, kept so cached trips stay keyed correctly while the session
  // cannot be refreshed (for example when launching offline with an expired token).
  authUserId: string | null;
  themePreference: ThemePreference;
  language: AppLanguage;
  trips: Trip[];
  members: TripMember[];
  expenses: Expense[];
  itineraryItems: ItineraryItem[];
  settlements: Settlement[];
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  completeOnboarding: () => void;
  enterGuest: () => void;
  enterAuthenticated: (userId: string) => void;
  signOut: () => void;
  setThemePreference: (value: ThemePreference) => void;
  setLanguage: (value: AppLanguage) => void;
  resetDemo: () => void;
  createTrip: (trip: NewTrip) => Promise<Id>;
  updateTrip: (tripId: Id, patch: Partial<NewTrip>) => Promise<void>;
  deleteTrip: (tripId: Id) => Promise<void>;
  addMember: (member: NewMember) => Promise<Id>;
  updateMember: (memberId: Id, patch: Partial<NewMember>) => Promise<void>;
  deleteMember: (memberId: Id) => Promise<void>;
  upsertExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: Id) => Promise<void>;
  addItineraryItem: (item: NewItinerary) => Promise<Id>;
  updateItineraryItem: (itemId: Id, patch: Partial<NewItinerary>) => Promise<void>;
  deleteItineraryItem: (itemId: Id) => Promise<void>;
  recordSettlement: (settlement: NewSettlement) => Promise<Id>;
  deleteSettlement: (settlementId: Id) => Promise<void>;
  clearLocalTrips: () => void;
}

const now = () => new Date().toISOString();
const seed = () => ({
  trips: demoTrips.map((trip) => ({ ...trip })),
  members: demoMembers.map((member) => ({ ...member })),
  expenses: demoExpenses.map((expense) => ({
    ...expense,
    splits: expense.splits.map((split) => ({ ...split })),
  })),
  itineraryItems: demoItineraryItems.map((item) => ({ ...item })),
  settlements: [] as Settlement[],
});
const emptyTrips = {
  trips: [],
  members: [],
  expenses: [],
  itineraryItems: [],
  settlements: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      onboardingCompleted: false,
      mode: 'none',
      authUserId: null,
      themePreference: 'system',
      language: 'tr',
      trips: [],
      members: [],
      expenses: [],
      itineraryItems: [],
      settlements: [],
      pendingInviteCode: null,
      setPendingInviteCode: (pendingInviteCode) => set({ pendingInviteCode }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      enterGuest: () => set((state) => ({ mode: 'guest', ...(state.trips.length ? {} : seed()) })),
      enterAuthenticated: (authUserId) => set({ mode: 'authenticated', authUserId }),
      signOut: () =>
        set((state) =>
          state.mode === 'authenticated'
            ? { mode: 'none', authUserId: null, ...emptyTrips }
            : { mode: 'none', authUserId: null },
        ),
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguage: (language) => set({ language }),
      resetDemo: () => set({ ...seed(), mode: 'guest' }),
      createTrip: async (input) => {
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
        const created = { trip, ownerMember: owner };
        set((state) => ({
          trips: [created.trip, ...state.trips],
          members: [...state.members, created.ownerMember],
        }));
        return id;
      },
      updateTrip: async (tripId, patch) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId ? { ...trip, ...patch, updatedAt: now() } : trip,
          ),
        }));
      },
      deleteTrip: async (tripId) => {
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== tripId),
          members: state.members.filter((member) => member.tripId !== tripId),
          expenses: state.expenses.filter((expense) => expense.tripId !== tripId),
          itineraryItems: state.itineraryItems.filter((item) => item.tripId !== tripId),
          settlements: state.settlements.filter((item) => item.tripId !== tripId),
        }));
      },
      addMember: async (input) => {
        const id = randomUUID();
        const member = { ...input, id, createdAt: now() };
        const created = member;
        set((state) => ({ members: [...state.members, created] }));
        return id;
      },
      updateMember: async (memberId, patch) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.id === memberId ? { ...member, ...patch } : member,
          ),
        }));
      },
      deleteMember: async (memberId) => {
        const { expenses, settlements } = get();
        const isUsed =
          expenses.some(
            (expense) =>
              expense.paidByMemberId === memberId ||
              expense.splits.some((split) => split.memberId === memberId),
          ) ||
          settlements.some(
            (settlement) =>
              settlement.fromMemberId === memberId || settlement.toMemberId === memberId,
          );
        if (isUsed) throw new Error('MEMBER_IN_USE');
        set((state) => ({ members: state.members.filter((member) => member.id !== memberId) }));
      },
      upsertExpense: async (expense) => {
        const saved = expense;
        set((state) => ({
          expenses: state.expenses.some((item) => item.id === saved.id)
            ? state.expenses.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...state.expenses],
        }));
      },
      deleteExpense: async (expenseId) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== expenseId),
        }));
      },
      addItineraryItem: async (input) => {
        const id = randomUUID();
        const timestamp = now();
        const item = { ...input, id, createdAt: timestamp, updatedAt: timestamp };
        const created = item;
        set((state) => ({ itineraryItems: [...state.itineraryItems, created] }));
        return id;
      },
      updateItineraryItem: async (itemId, patch) => {
        set((state) => ({
          itineraryItems: state.itineraryItems.map((item) =>
            item.id === itemId ? { ...item, ...patch, updatedAt: now() } : item,
          ),
        }));
      },
      deleteItineraryItem: async (itemId) => {
        set((state) => ({
          itineraryItems: state.itineraryItems.filter((item) => item.id !== itemId),
        }));
      },
      recordSettlement: async (input) => {
        const id = randomUUID();
        const timestamp = now();
        const settlement: Settlement = {
          ...input,
          id,
          status: 'paid',
          paidAt: timestamp,
          createdAt: timestamp,
        };
        set((state) => ({ settlements: [...state.settlements, settlement] }));
        return id;
      },
      deleteSettlement: async (settlementId) => {
        set((state) => ({
          settlements: state.settlements.filter((item) => item.id !== settlementId),
        }));
      },
      clearLocalTrips: () => set(emptyTrips),
    }),
    {
      name: 'tripwise-app-v1',
      storage: createJSONStorage(() => appLocalStorage),
      partialize: ({ hasHydrated: _hasHydrated, ...state }) => state,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
