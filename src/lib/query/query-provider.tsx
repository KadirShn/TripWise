import 'expo-sqlite/localStorage/install';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider, type Persister } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'online' },
  },
});

const persister: Persister = {
  persistClient: async (client) =>
    localStorage.setItem('tripwise-query-cache-v1', JSON.stringify(client)),
  restoreClient: async () => {
    const cached = localStorage.getItem('tripwise-query-cache-v1');
    return cached ? JSON.parse(cached) : undefined;
  },
  removeClient: async () => localStorage.removeItem('tripwise-query-cache-v1'),
};

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  );
}
