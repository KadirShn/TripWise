import * as Linking from 'expo-linking';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { use } from 'react';
import { clearOtherUsersQueryCache, clearRemoteQueryCache } from '@/lib/query/query-client';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import {
  invokeDeleteAccount,
  signInWithEmail,
  signOutSafely,
  signUpWithEmail,
} from './auth-service';
import { parseAuthUrl, type AuthUrlTokens } from './auth-url';

type RecoveryStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  recoveryStatus: RecoveryStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<{ remoteSignOutFailed: boolean }>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(Boolean(supabase));
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>('idle');
  const enterAuthenticated = useAppStore((state) => state.enterAuthenticated);
  const clearMode = useAppStore((state) => state.signOut);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        clearOtherUsersQueryCache(data.session.user.id);
        enterAuthenticated();
      } else if (useAppStore.getState().mode === 'authenticated') clearMode();
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setRecoveryStatus('ready');
      if (nextSession) {
        clearOtherUsersQueryCache(nextSession.user.id);
        enterAuthenticated();
      } else if (useAppStore.getState().mode === 'authenticated') clearMode();
    });
    return () => data.subscription.unsubscribe();
  }, [clearMode, enterAuthenticated]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const handleUrl = async (url: string) => {
      let tokens: AuthUrlTokens;
      try {
        tokens = parseAuthUrl(url);
      } catch {
        setRecoveryStatus('error');
        return;
      }
      if (tokens.errorDescription) {
        setRecoveryStatus('error');
        return;
      }
      if (!tokens.accessToken && !tokens.code) return;
      if (tokens.type === 'recovery') setRecoveryStatus('loading');
      const { error } = tokens.code
        ? await client.auth.exchangeCodeForSession(tokens.code)
        : await client.auth.setSession({
            access_token: tokens.accessToken ?? '',
            refresh_token: tokens.refreshToken ?? '',
          });
      if (error) setRecoveryStatus('error');
      else if (tokens.type === 'recovery') setRecoveryStatus('ready');
    };
    void Linking.getInitialURL().then((url) => {
      if (url) return handleUrl(url);
      return undefined;
    });
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      recoveryStatus,
      signIn: async (email, password) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        await signInWithEmail(supabase, email, password);
      },
      signUp: async (email, password, displayName) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        return signUpWithEmail(supabase, email, password, displayName);
      },
      resetPassword: async (email) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'tripwise://reset-password',
        });
        if (error) throw error;
      },
      updatePassword: async (password) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setRecoveryStatus('idle');
      },
      signOut: async () => {
        const userId = session?.user.id;
        const result = supabase ? await signOutSafely(supabase) : { remoteSignOutFailed: false };
        clearRemoteQueryCache(userId);
        setSession(null);
        clearMode();
        return result;
      },
      deleteAccount: async () => {
        if (!supabase || !session) throw new Error('AUTH_REQUIRED');
        const userId = session.user.id;
        await invokeDeleteAccount(supabase);
        await supabase.auth.signOut({ scope: 'local' });
        clearRemoteQueryCache(userId);
        setSession(null);
        clearMode();
      },
    }),
    [clearMode, isLoading, recoveryStatus, session],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
