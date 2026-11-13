import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/**
 * Test mode (sample data, accounts saved only on the device) is ONLY for development:
 * `npx expo start`, or a build made with EXPO_PUBLIC_DEMO=1.
 * A production build without Supabase keys shows a "not connected" screen instead of fake data.
 */
export const DEMO_ALLOWED = __DEV__ || process.env.EXPO_PUBLIC_DEMO === '1';

/** Null when the env vars are not set. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;
