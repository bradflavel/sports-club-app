'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/database.types';
import type { User } from '@supabase/supabase-js';

// Shared singleton state so multiple useUser() calls don't duplicate requests
let cachedUser: User | null = null;
let cachedProfile: Profile | null = null;
let loadPromise: Promise<void> | null = null;
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function loadUserData(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    cachedUser = user;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      cachedProfile = profile;
    }
    notifyListeners();
  })();

  return loadPromise;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedUser && !loadPromise);

  useEffect(() => {
    const listener = () => {
      setUser(cachedUser);
      setProfile(cachedProfile);
      setLoading(false);
    };
    listeners.add(listener);

    if (!loadPromise) {
      setLoading(true);
      loadUserData();
    } else if (cachedUser !== null) {
      // Already loaded
      listener();
    } else {
      // Loading in progress, wait for notification
      loadPromise.then(listener);
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      cachedUser = session?.user ?? null;
      if (!session?.user) {
        cachedProfile = null;
        loadPromise = null;
      }
      notifyListeners();
    });

    return () => {
      listeners.delete(listener);
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
