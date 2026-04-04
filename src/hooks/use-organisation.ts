'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Organisation } from '@/lib/supabase/database.types';
import { useUser } from './use-user';

export function useOrganisation() {
  const { profile, loading: userLoading } = useUser();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    async function getOrganisation() {
      if (!profile?.organisation_id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', profile.organisation_id)
        .single();

      setOrganisation(data);
      setLoading(false);
    }

    getOrganisation();
  }, [profile, userLoading]);

  return { organisation, loading: loading || userLoading };
}
