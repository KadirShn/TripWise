import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  type AuthError,
  type Session,
} from '@supabase/supabase-js';
import {
  decideSessionBootstrap,
  loadSessionWithTimeout,
  shouldBlockOnSessionRestore,
  type SessionLoadResult,
} from './session-bootstrap';

const session = { access_token: 'token', user: { id: 'user-1' } } as unknown as Session;
const loaded = (value: Session | null, error: AuthError | null = null): SessionLoadResult => ({
  kind: 'loaded',
  session: value,
  error,
});
type LoadResponse = { data: { session: Session | null }; error: AuthError | null };

describe('decideSessionBootstrap', () => {
  it('enters authenticated mode when a session is restored', () => {
    expect(decideSessionBootstrap(loaded(session))).toEqual({
      action: 'enterAuthenticated',
      session,
    });
  });

  it('keeps the account mode when the refresh fails because the device is offline', () => {
    const error = new AuthRetryableFetchError('Unable to resolve host', 0);
    expect(decideSessionBootstrap(loaded(null, error))).toEqual({ action: 'keep' });
  });

  it('signs out when the refresh token is rejected', () => {
    const error = new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found');
    expect(decideSessionBootstrap(loaded(null, error))).toEqual({ action: 'signOut' });
  });

  it('signs out when the session is missing', () => {
    expect(decideSessionBootstrap(loaded(null, new AuthSessionMissingError()))).toEqual({
      action: 'signOut',
    });
  });

  it('signs out when no session is stored', () => {
    expect(decideSessionBootstrap(loaded(null))).toEqual({ action: 'signOut' });
  });

  it('keeps the current mode on timeout or unexpected failures', () => {
    expect(decideSessionBootstrap({ kind: 'timeout' })).toEqual({ action: 'keep' });
    expect(decideSessionBootstrap({ kind: 'failed', error: new Error('boom') })).toEqual({
      action: 'keep',
    });
  });
});

describe('shouldBlockOnSessionRestore', () => {
  it('never blocks guest mode', () => {
    expect(shouldBlockOnSessionRestore('guest')).toBe(false);
  });

  it('waits for account and signed-out modes', () => {
    expect(shouldBlockOnSessionRestore('authenticated')).toBe(true);
    expect(shouldBlockOnSessionRestore('none')).toBe(true);
  });
});

describe('loadSessionWithTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const deferred = () => {
    let resolve: (value: LoadResponse) => void = () => undefined;
    let reject: (error: unknown) => void = () => undefined;
    const promise = new Promise<LoadResponse>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  it('reports the loaded session before the timeout', async () => {
    const onSettled = jest.fn();
    loadSessionWithTimeout(async () => ({ data: { session }, error: null }), 3500, onSettled);
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(5000);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith({ kind: 'loaded', session, error: null });
  });

  it('times out and still reports a late definitive result', async () => {
    const onSettled = jest.fn();
    const pending = deferred();
    loadSessionWithTimeout(() => pending.promise, 3500, onSettled);
    jest.advanceTimersByTime(3500);
    expect(onSettled).toHaveBeenLastCalledWith({ kind: 'timeout' });
    const error = new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found');
    pending.resolve({ data: { session: null }, error });
    await pending.promise;
    await Promise.resolve();
    expect(onSettled).toHaveBeenCalledTimes(2);
    expect(onSettled).toHaveBeenLastCalledWith({ kind: 'loaded', session: null, error });
  });

  it('ignores a late unexpected failure after the timeout', async () => {
    const onSettled = jest.fn();
    const pending = deferred();
    loadSessionWithTimeout(() => pending.promise, 3500, onSettled);
    jest.advanceTimersByTime(3500);
    pending.reject(new Error('boom'));
    await pending.promise.catch(() => undefined);
    await Promise.resolve();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('reports nothing after cancellation', async () => {
    const onSettled = jest.fn();
    const pending = deferred();
    const cancel = loadSessionWithTimeout(() => pending.promise, 3500, onSettled);
    cancel();
    jest.advanceTimersByTime(5000);
    pending.resolve({ data: { session }, error: null });
    await pending.promise;
    await Promise.resolve();
    expect(onSettled).not.toHaveBeenCalled();
  });
});
