'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Organisation } from '@/lib/supabase/database.types';
import { useUser } from './use-user';

// Cache to avoid re-fetching when multiple components use this hook
let cachedOrg: Organisation | null = null;
let cachedOrgId: string | null = null;

export function useOrganisation() {
  const { profile, loading: userLoading } = useUser();
  const [organisation, setOrganisation] = useState<Organisation | null>(cachedOrg);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    const orgId = profile?.organisation_id ?? null;

    if (!orgId) {
      setOrganisation(null);
      setLoading(false);
      return;
    }

    // Use cache if same org
    if (cachedOrg && cachedOrgId === orgId) {
      setOrganisation(cachedOrg);
      setLoading(false);
      return;
    }

    async function fetchOrg() {
      const supabase = createClient();
      const { data } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', orgId!)
        .single();

      cachedOrg = data as unknown as Organisation | null;
      cachedOrgId = orgId;
      setOrganisation(data as unknown as Organisation | null);
      setLoading(false);
    }

    fetchOrg();
  }, [profile?.organisation_id, userLoading]);

  return { organisation, loading: loading || userLoading };
}
