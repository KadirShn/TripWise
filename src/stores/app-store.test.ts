import { useAppStore } from './app-store';

jest.mock('expo-crypto', () => {
  let id = 0;
  return { randomUUID: () => `test-id-${++id}` };
});

const emptyState = {
  hasHydrated: true,
  onboardingCompleted: true,
  mode: 'none' as const,
  themePreference: 'system' as const,
  language: 'tr' as const,
  trips: [],
  members: [],
  expenses: [],
  itineraryItems: [],
  settlements: [],
  pendingInviteCode: null,
};

describe('persisted guest state', () => {
  beforeEach(async () => {
    localStorage.clear();
    useAppStore.setState(emptyState);
    await useAppStore.persist.clearStorage();
  });

  it('restores guest trips and language after a simulated restart', async () => {
    useAppStore.getState().enterGuest();
    useAppStore.getState().setLanguage('en');
    const tripId = await useAppStore.getState().createTrip({
      title: 'Persisted trip',
      destination: 'Ankara',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      baseCurrency: 'TRY',
      budgetAmountMinor: null,
      coverEmoji: '🧳',
    });
    await Promise.resolve();
    const persisted = localStorage.getItem('tripwise-app-v1');
    expect(persisted).not.toBeNull();

    useAppStore.setState(emptyState);
    localStorage.setItem('tripwise-app-v1', persisted ?? '');
    await useAppStore.persist.rehydrate();

    expect(useAppStore.getState().mode).toBe('guest');
    expect(useAppStore.getState().language).toBe('en');
    expect(useAppStore.getState().trips.some((trip) => trip.id === tripId)).toBe(true);
  });
});
