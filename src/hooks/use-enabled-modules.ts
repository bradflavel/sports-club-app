'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrganisation } from '@/hooks/use-organisation';
import { getModules, initDefaultModules } from '@/features/activities/services/module-service';
import type { OrganisationModule } from '@/lib/supabase/database.types';

export function useEnabledModules() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const [modules, setModules] = useState<OrganisationModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    if (!organisation?.id) return;

    setLoading(true);
    const { data, error } = await getModules(organisation.id);

    if (error) {
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      const { data: defaultData } = await initDefaultModules(organisation.id);
      setModules(defaultData ?? []);
    } else {
      setModules(data);
    }

    setLoading(false);
  }, [organisation?.id]);

  useEffect(() => {
    if (orgLoading) return;
    fetchModules();
  }, [orgLoading, fetchModules]);

  const enabledModules = modules.filter((m) => m.is_enabled);

  return {
    modules,
    enabledModules,
    loading: loading || orgLoading,
    refetch: fetchModules,
  };
}
