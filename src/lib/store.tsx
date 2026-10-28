import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Api } from './api';
import { createDemoApi } from './demo';
import { createLiveApi } from './live';
import { supabase } from './supabase';
import type { Profile } from './types';

const api: Api = supabase ? createLiveApi(supabase) : createDemoApi();

type Ctx = {
  api: Api;
  me: Profile | null;
  ready: boolean;
  /** Bumps after any change so screens refetch. */
  version: number;
  changed: () => void;
  refreshMe: () => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  const refreshMe = useCallback(async () => {
    try {
      setMe(await api.getMe());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshMe();
    return api.onAuthChange(() => {
      refreshMe();
      setVersion((v) => v + 1);
    });
  }, [refreshMe]);

  const value = useMemo<Ctx>(
    () => ({ api, me, ready, version, changed: () => setVersion((v) => v + 1), refreshMe }),
    [me, ready, version, refreshMe],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

/** Loads data, reloading when the screen gains focus or anything changes. */
export function useData<T>(load: (api: Api) => Promise<T>, deps: unknown[]) {
  const { api: a, version, me } = useApp();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    loadRef
      .current(a)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, version, me?.id, ...deps]);

  useFocusEffect(run);
  return { data, error, loading, reload: run, setData };
}
