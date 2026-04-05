'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { calculateAge } from '@/lib/format';
import {
  getAgedOutJuniors,
  processAgeOut,
  bulkProcessAgeOut,
} from '@/features/members/services/age-transition-service';
import type { MemberWithProfile } from '@/lib/supabase/database.types';

interface AgeTransitionAlertProps {
  orgId: string;
}

export function AgeTransitionAlert({ orgId }: AgeTransitionAlertProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchAgedOut = useCallback(async () => {
    const { data } = await getAgedOutJuniors(orgId);
    setMembers(data ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchAgedOut();
  }, [fetchAgedOut]);

  async function handleProcessAgeOut(memberId: string) {
    setProcessing(memberId);
    const { error } = await processAgeOut(memberId);
    if (error) {
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } else {
      toast({ title: 'Age-out processed — guardians removed' });
      fetchAgedOut();
    }
    setProcessing(null);
  }

  async function handleBulkProcess() {
    setBulkProcessing(true);
    const ids = members.map((m) => m.id);
    const { successes, failures } = await bulkProcessAgeOut(ids);
    if (failures > 0) {
      toast({
        title: `${successes} processed, ${failures} failed`,
        variant: 'destructive',
      });
    } else {
      toast({ title: `${successes} member${successes !== 1 ? 's' : ''} age-out processed — guardians removed` });
    }
    fetchAgedOut();
    setBulkProcessing(false);
  }

  if (loading || members.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">
              {members.length} member{members.length !== 1 ? 's' : ''} ha
              {members.length !== 1 ? 've' : 's'} turned 18 and still ha
              {members.length !== 1 ? 've' : 's'} guardian links
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              Processing will remove guardian links and copy guardian contact details to emergency
              contacts where needed.
            </p>
          </div>
        </div>
        {members.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
            onClick={handleBulkProcess}
            disabled={bulkProcessing}
          >
            {bulkProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            Process All
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {members.map((member) => {
          const age = member.profile.date_of_birth
            ? calculateAge(member.profile.date_of_birth)
            : null;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    {member.profile.first_name} {member.profile.last_name}
                  </p>
                  <p className="text-xs text-amber-700">
                    {age !== null ? `${age} years old` : 'DOB unknown'} · {member.profile.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/members/${member.id}`}
                  className="text-xs text-amber-700 hover:underline flex items-center gap-1"
                >
                  View <ArrowRight className="h-3 w-3" />
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
                  onClick={() => handleProcessAgeOut(member.id)}
                  disabled={processing === member.id}
                >
                  {processing === member.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Process'
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
