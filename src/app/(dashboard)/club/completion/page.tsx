'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { useOrganisation } from '@/hooks/use-organisation';
import { useAuth } from '@/hooks/use-auth-context';
import { createClient } from '@/lib/supabase/client';
import { getCompletionItems, getCompletionPercentage } from '@/features/club-profile/components/club-completion-tracker';
import type { ClubVenue, MembershipTypeRecord } from '@/lib/supabase/database.types';

export default function ClubCompletionPage() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { profile, loading: userLoading } = useAuth();
  const router = useRouter();

  const [venues, setVenues] = useState<ClubVenue[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!organisation) return;
    const supabase = createClient();
    const [v, t] = await Promise.all([
      supabase.from('club_venues').select('*').eq('organisation_id', organisation.id),
      supabase.from('membership_types').select('*').eq('organisation_id', organisation.id).order('display_order'),
    ]);
    setVenues((v.data ?? []) as ClubVenue[]);
    setMembershipTypes((t.data ?? []) as MembershipTypeRecord[]);
    setLoading(false);
  }, [organisation]);

  useEffect(() => {
    if (organisation) fetchData();
  }, [organisation, fetchData]);

  if (orgLoading || userLoading || loading) return <PageSkeleton />;
  if (!organisation || !isAdmin) {
    router.push('/club');
    return null;
  }

  const items = getCompletionItems(organisation, venues, membershipTypes);
  const percentage = getCompletionPercentage(organisation, venues, membershipTypes);
  const completedCount = items.filter((i) => i.completed).length;
  const incompleteCount = items.length - completedCount;
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Completion"
        actions={
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/club">
              <ArrowLeft className="h-4 w-4" />
              Back to Club
            </Link>
          </Button>
        }
      />

      {/* Summary */}
      <div className="flex items-center gap-3">
        <Progress value={percentage} className="w-32" />
        <span className="text-sm font-semibold tabular-nums">{percentage}%</span>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{items.length}
          {incompleteCount > 0 && ` · ${incompleteCount} remaining`}
        </span>
      </div>

      {/* Compact checklist */}
      <div className="rounded-lg border divide-y">
        {categories.map((category) => {
          const catItems = items.filter((i) => i.category === category);
          const catDone = catItems.filter((i) => i.completed).length;

          return (
            <div key={category} className="flex items-start gap-4 px-4 py-3">
              {/* Category label */}
              <div className="w-28 shrink-0 pt-0.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </span>
                <span className="ml-1.5 text-[10px] text-muted-foreground/50">
                  {catDone}/{catItems.length}
                </span>
              </div>

              {/* Items */}
              <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1.5">
                {catItems.map((item) =>
                  item.completed ? (
                    <span key={item.label} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      key={item.label}
                      href={`/club?edit=true&tab=${item.editTab}`}
                      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
