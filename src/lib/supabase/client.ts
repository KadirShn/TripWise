import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import type { SupportedStorage } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { appLocalStorage } from '@/lib/storage/local-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
export const isSupabaseConfigured = Boolean(url && publishableKey);

const secureStorage: SupportedStorage = {
  getItem: async (key) =>
    process.env.EXPO_OS === 'web' ? appLocalStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: async (key, value) => {
    if (process.env.EXPO_OS === 'web') appLocalStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    if (process.env.EXPO_OS === 'web') appLocalStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = isSupabaseConfigured
  ? createClient<Database>(url as string, publishableKey as string, {
      auth: {
        storage: secureStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: process.env.EXPO_OS === 'web',
      },
    })
  : null;
