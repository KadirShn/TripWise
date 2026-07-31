import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(Boolean(supabase));
  const enterAuthenticated = useAppStore((state) => state.enterAuthenticated);
  const clearMode = useAppStore((state) => state.signOut);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) enterAuthenticated();
      else if (useAppStore.getState().mode === 'authenticated') clearMode();
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) enterAuthenticated();
      else if (useAppStore.getState().mode === 'authenticated') clearMode();
    });
    return () => data.subscription.unsubscribe();
  }, [clearMode, enterAuthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signIn: async (email, password) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, displayName) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
      },
      resetPassword: async (email) => {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'tripwise://reset-password',
        });
        if (error) throw error;
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setSession(null);
        clearMode();
      },
    }),
    [clearMode, isLoading, session],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
