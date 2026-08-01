import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';
import { QUERY_CACHE_BUSTER, queryClient, queryPersister } from '@/lib/query/query-client';

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, buster: QUERY_CACHE_BUSTER }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
