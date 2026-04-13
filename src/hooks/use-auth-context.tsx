'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organisation, UserOrganisation } from '@/lib/supabase/database.types';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  organisation: Organisation | null;
  memberships: UserOrganisation[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
  switchOrganisation: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  organisation: null,
  memberships: [],
  loading: true,
  refreshProfile: async () => {},
  switchOrganisation: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [memberships, setMemberships] = useState<UserOrganisation[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUserData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData as unknown as Profile | null);

      if (profileData?.organisation_id) {
        const { data: orgData } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', profileData.organisation_id)
          .single();
        setOrganisation(orgData as unknown as Organisation | null);
      } else {
        setOrganisation(null);
      }

      const { data: orgList } = await supabase.rpc('get_user_organisations');
      setMemberships((orgList ?? []) as unknown as UserOrganisation[]);
    } else {
      setProfile(null);
      setOrganisation(null);
      setMemberships([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUserData();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setOrganisation(null);
        setMemberships([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    await loadUserData();
  };

  const switchOrganisation = async (orgId: string) => {
    const supabase = createClient();
    const { error } = await supabase.rpc('switch_active_organisation', { p_org_id: orgId });
    if (error) throw error;
    await loadUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organisation,
        memberships,
        loading,
        refreshProfile,
        switchOrganisation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
