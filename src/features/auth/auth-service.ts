import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type TripWiseSupabaseClient = SupabaseClient<Database>;

export const signInWithEmail = async (
  client: TripWiseSupabaseClient,
  email: string,
  password: string,
) => {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signUpWithEmail = async (
  client: TripWiseSupabaseClient,
  email: string,
  password: string,
  displayName: string,
) => {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: 'tripwise://',
    },
  });
  if (error) throw error;
  return { requiresEmailConfirmation: data.session === null };
};

export const signOutSafely = async (client: TripWiseSupabaseClient) => {
  const { error } = await client.auth.signOut();
  if (!error) return { remoteSignOutFailed: false };
  const { error: localError } = await client.auth.signOut({ scope: 'local' });
  if (localError) throw localError;
  return { remoteSignOutFailed: true };
};

export const invokeDeleteAccount = async (client: TripWiseSupabaseClient) => {
  const { error } = await client.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
};
