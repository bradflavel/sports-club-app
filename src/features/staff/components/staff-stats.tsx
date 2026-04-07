'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getStaffStats } from '../services/staff-service';

interface StaffStatsProps {
  organisationId: string;
}

export function StaffStats({ organisationId }: StaffStatsProps) {
  const [stats, setStats] = useState({ total: 0, active: 0, expiringAccreditations: 0 });

  const fetchStats = useCallback(async () => {
    const result = await getStaffStats(organisationId);
    setStats(result);
  }, [organisationId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    { label: 'Total Staff', value: stats.total, icon: Users },
    { label: 'Active', value: stats.active, icon: UserCheck },
    { label: 'Expiring Accreditations', value: stats.expiringAccreditations, icon: AlertTriangle, warning: stats.expiringAccreditations > 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2 ${card.warning ? 'bg-amber-100 text-amber-700' : 'bg-muted'}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
