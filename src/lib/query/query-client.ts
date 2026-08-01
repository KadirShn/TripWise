import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient, type QueryKey } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { AppState } from 'react-native';
import { appLocalStorage } from '@/lib/storage/local-storage';

export const QUERY_CACHE_STORAGE_KEY = 'tripwise-query-cache-v2';
export const QUERY_CACHE_BUSTER = 'tripwise-cache-v2';
const LEGACY_QUERY_CACHE_STORAGE_KEY = 'tripwise-query-cache-v1';
const REMOTE_QUERY_PREFIX = ['tripwise', 'remote-snapshot'] as const;

export const remoteSnapshotQueryKey = (userId: string): QueryKey => [
  ...REMOTE_QUERY_PREFIX,
  userId,
];

export const isRemoteSnapshotQuery = (queryKey: readonly unknown[]) =>
  queryKey[0] === REMOTE_QUERY_PREFIX[0] && queryKey[1] === REMOTE_QUERY_PREFIX[1];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: { networkMode: 'online' },
  },
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (state) => {
    setFocused(state === 'active');
  });
  return () => subscription.remove();
});

export const clearRemoteQueryCache = (userId?: string) => {
  queryClient.removeQueries({
    predicate: (query) => {
      if (!isRemoteSnapshotQuery(query.queryKey)) return false;
      return userId ? query.queryKey[2] === userId : true;
    },
  });
};

export const clearOtherUsersQueryCache = (currentUserId: string) => {
  queryClient.removeQueries({
    predicate: (query) =>
      isRemoteSnapshotQuery(query.queryKey) && query.queryKey[2] !== currentUserId,
  });
};

export const queryPersister: Persister = {
  persistClient: async (client) => {
    appLocalStorage.setItem(QUERY_CACHE_STORAGE_KEY, JSON.stringify(client));
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    appLocalStorage.removeItem(LEGACY_QUERY_CACHE_STORAGE_KEY);
    const cached = appLocalStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!cached) return undefined;
    try {
      return JSON.parse(cached) as PersistedClient;
    } catch {
      appLocalStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return undefined;
    }
  },
  removeClient: async () => appLocalStorage.removeItem(QUERY_CACHE_STORAGE_KEY),
};
