'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStaffStats } from '../services/staff-service';

interface StaffExpiryAlertProps {
  orgId: string;
}

export function StaffExpiryAlert({ orgId }: StaffExpiryAlertProps) {
  const router = useRouter();
  const [expiringCount, setExpiringCount] = useState(0);

  const fetchStats = useCallback(async () => {
    const result = await getStaffStats(orgId);
    setExpiringCount(result.expiringAccreditations);
  }, [orgId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (expiringCount === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {expiringCount} staff accreditation{expiringCount !== 1 ? 's' : ''} expiring within 30 days
            </p>
            <p className="text-xs text-muted-foreground">Review and ensure renewals are in progress</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/staff')}>
          View Staff
        </Button>
      </CardContent>
    </Card>
  );
}
