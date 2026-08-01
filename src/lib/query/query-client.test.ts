import {
  clearOtherUsersQueryCache,
  clearRemoteQueryCache,
  QUERY_CACHE_STORAGE_KEY,
  queryClient,
  queryPersister,
  remoteSnapshotQueryKey,
} from './query-client';

describe('user-scoped query cache', () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.clear();
  });

  it('keeps only the current user snapshot when accounts change', () => {
    queryClient.setQueryData(remoteSnapshotQueryKey('user-a'), { trips: ['private-a'] });
    queryClient.setQueryData(remoteSnapshotQueryKey('user-b'), { trips: ['private-b'] });

    clearOtherUsersQueryCache('user-b');

    expect(queryClient.getQueryData(remoteSnapshotQueryKey('user-a'))).toBeUndefined();
    expect(queryClient.getQueryData(remoteSnapshotQueryKey('user-b'))).toEqual({
      trips: ['private-b'],
    });
  });

  it('clears the signed-out user snapshot', () => {
    queryClient.setQueryData(remoteSnapshotQueryKey('user-a'), { trips: ['private-a'] });
    clearRemoteQueryCache('user-a');
    expect(queryClient.getQueryData(remoteSnapshotQueryKey('user-a'))).toBeUndefined();
  });

  it('discards a corrupted persisted cache instead of crashing', async () => {
    localStorage.setItem(QUERY_CACHE_STORAGE_KEY, '{broken-json');
    await expect(queryPersister.restoreClient()).resolves.toBeUndefined();
    expect(localStorage.getItem(QUERY_CACHE_STORAGE_KEY)).toBeNull();
  });
});
