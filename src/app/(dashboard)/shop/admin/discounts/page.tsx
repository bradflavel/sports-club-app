'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { DiscountCodeTable } from '@/features/shop/components/admin/discount-code-table';
import { getDiscountCodes, deactivateDiscountCode } from '@/features/shop/services/discount-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { DiscountCode } from '@/lib/supabase/database.types';

export default function DiscountsPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchCodes = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    const { data, error } = await getDiscountCodes(organisation.id);
    if (!error) setCodes(data);
    setLoading(false);
  }, [organisation?.id]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchCodes();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchCodes]);

  const handleDeactivate = async (codeId: string) => {
    setDeactivatingId(codeId);
    const { error } = await deactivateDiscountCode(codeId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Discount code deactivated' });
      fetchCodes();
    }
    setDeactivatingId(null);
  };

  if (orgLoading || userLoading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to Shop Admin
        </Link>
      </Button>

      <PageHeader
        title="Discount Codes"
        description="Manage promotional codes"
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/shop/admin/discounts/new">
              <Plus className="h-4 w-4" />
              New Code
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <DiscountCodeTable
          codes={codes}
          onDeactivate={handleDeactivate}
          deactivatingId={deactivatingId}
        />
      )}
    </div>
  );
}
