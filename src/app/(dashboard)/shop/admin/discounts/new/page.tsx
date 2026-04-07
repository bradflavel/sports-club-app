'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { DiscountCodeForm } from '@/features/shop/components/admin/discount-code-form';
import { createDiscountCode } from '@/features/shop/services/discount-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { DiscountCodeInput } from '@/features/shop/schemas/discount-schemas';

export default function NewDiscountCodePage() {
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const handleSubmit = async (data: DiscountCodeInput) => {
    if (!organisation?.id || !profile?.id) return;
    setLoading(true);

    const { error } = await createDiscountCode({
      organisation_id: organisation.id,
      code: data.code,
      description: data.description ?? null,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      min_order_cents: data.minOrderCents ?? null,
      max_discount_cents: data.maxDiscountCents ?? null,
      applies_to_product_id: data.appliesToProductId ?? null,
      applies_to_category_id: data.appliesToCategoryId ?? null,
      max_uses: data.maxUses ?? null,
      max_uses_per_user: data.maxUsesPerUser ?? null,
      starts_at: data.startsAt ?? null,
      expires_at: data.expiresAt ?? null,
      is_active: data.isActive ?? true,
      created_by: profile.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Discount code created!' });
      router.push('/shop/admin/discounts');
    }
    setLoading(false);
  };

  if (orgLoading || userLoading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/admin/discounts">
          <ArrowLeft className="h-4 w-4" />
          Back to Discounts
        </Link>
      </Button>

      <PageHeader title="New Discount Code" />

      <DiscountCodeForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
