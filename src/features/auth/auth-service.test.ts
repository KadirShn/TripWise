import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  invokeDeleteAccount,
  signInWithEmail,
  signOutSafely,
  signUpWithEmail,
} from './auth-service';

const client = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  functions: {
    invoke: jest.fn(),
  },
} as unknown as SupabaseClient<Database>;

const auth = client.auth as unknown as {
  signInWithPassword: jest.Mock;
  signUp: jest.Mock;
  signOut: jest.Mock;
};
const functions = client.functions as unknown as { invoke: jest.Mock };

describe('auth service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('signs in with email credentials and propagates server errors', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
    await expect(signInWithEmail(client, 'user@example.com', 'password')).resolves.toBeUndefined();
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    });

    const error = new Error('invalid credentials');
    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error });
    await expect(signInWithEmail(client, 'user@example.com', 'wrong')).rejects.toBe(error);
  });

  it('distinguishes email-confirmation signup from an immediate session', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(signUpWithEmail(client, 'a@b.com', 'password', 'Ada')).resolves.toEqual({
      requiresEmailConfirmation: true,
    });

    auth.signUp.mockResolvedValueOnce({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    await expect(signUpWithEmail(client, 'a@b.com', 'password', 'Ada')).resolves.toEqual({
      requiresEmailConfirmation: false,
    });
  });

  it('falls back to a local sign-out when the server is unreachable', async () => {
    auth.signOut
      .mockResolvedValueOnce({ error: new Error('network') })
      .mockResolvedValueOnce({ error: null });
    await expect(signOutSafely(client)).resolves.toEqual({ remoteSignOutFailed: true });
    expect(auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
  });

  it('invokes the authenticated account deletion Edge Function', async () => {
    functions.invoke.mockResolvedValueOnce({ data: { deleted: true }, error: null });

    await expect(invokeDeleteAccount(client)).resolves.toBeUndefined();
    expect(functions.invoke).toHaveBeenCalledWith('delete-account', { method: 'POST' });

    const error = new Error('cleanup failed');
    functions.invoke.mockResolvedValueOnce({ data: null, error });
    await expect(invokeDeleteAccount(client)).rejects.toBe(error);
  });
});
