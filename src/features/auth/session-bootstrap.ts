import {
  isAuthApiError,
  isAuthSessionMissingError,
  type AuthError,
  type Session,
} from '@supabase/supabase-js';
import type { AppMode } from '@/stores/app-store';

// Upper bound for blocking the bootstrap route on session restore. supabase-js keeps
// retrying an expired-token refresh for ~30s when the device is offline.
export const SESSION_BOOTSTRAP_TIMEOUT_MS = 3500;

export type SessionLoadResult =
  | { kind: 'loaded'; session: Session | null; error: AuthError | null }
  | { kind: 'failed'; error: unknown }
  | { kind: 'timeout' };

export type SessionBootstrapDecision =
  | { action: 'enterAuthenticated'; session: Session }
  // The session is definitively gone (no stored session, or the refresh token was rejected).
  | { action: 'signOut' }
  // Session state is unknown (offline, timeout, unexpected failure). Keep the current
  // mode and cached data; supabase-js keeps the stored session and auto-refreshes later.
  | { action: 'keep' };

const isDefinitiveAuthFailure = (error: unknown) =>
  isAuthApiError(error) || isAuthSessionMissingError(error);

export function decideSessionBootstrap(result: SessionLoadResult): SessionBootstrapDecision {
  if (result.kind === 'timeout' || result.kind === 'failed') return { action: 'keep' };
  if (result.session) return { action: 'enterAuthenticated', session: result.session };
  if (!result.error || isDefinitiveAuthFailure(result.error)) return { action: 'signOut' };
  return { action: 'keep' };
}

// Guest data is fully local, so guests never wait for a remote session refresh.
export const shouldBlockOnSessionRestore = (mode: AppMode) => mode !== 'guest';

export function loadSessionWithTimeout(
  load: () => Promise<{ data: { session: Session | null }; error: AuthError | null }>,
  timeoutMs: number,
  onSettled: (result: SessionLoadResult) => void,
): () => void {
  let timedOut = false;
  let settled = false;
  const timer = setTimeout(() => {
    timedOut = true;
    onSettled({ kind: 'timeout' });
  }, timeoutMs);
  const settle = (result: SessionLoadResult) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    // A late result still matters: it can confirm the session or a definitive sign-out.
    if (!timedOut || result.kind === 'loaded') onSettled(result);
  };
  load().then(
    ({ data, error }) => settle({ kind: 'loaded', session: data.session, error }),
    (error: unknown) => settle({ kind: 'failed', error }),
  );
  return () => {
    settled = true;
    clearTimeout(timer);
  };
}
