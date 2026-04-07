'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { ProductDetail } from '@/features/shop/components/product-detail';
import { CartSheet } from '@/features/shop/components/cart-sheet';
import { getProductBySlug, checkProductAccess } from '@/features/shop/services/shop-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ProductWithVariants } from '@/lib/supabase/database.types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartRefreshKey, setCartRefreshKey] = useState(0);

  const slug = params.slug as string;

  const fetchProduct = useCallback(async () => {
    if (!organisation?.id || !profile?.id) return;
    setLoading(true);

    const { data, error } = await getProductBySlug(organisation.id, slug);

    if (error || !data) {
      toast({ title: 'Product not found', variant: 'destructive' });
      router.push('/shop');
      return;
    }

    // Check access if restricted
    if (data.is_restricted) {
      const hasAccess = await checkProductAccess(data.id, profile.id);
      if (!hasAccess) {
        toast({ title: 'Access denied', description: 'You do not have access to this product.', variant: 'destructive' });
        router.push('/shop');
        return;
      }
    }

    setProduct(data);
    setLoading(false);
  }, [organisation?.id, profile?.id, slug, toast, router]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id && profile?.id) {
      fetchProduct();
    }
  }, [orgLoading, userLoading, organisation?.id, profile?.id, fetchProduct]);

  if (orgLoading || userLoading || loading) return <PageSkeleton />;
  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/shop">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </Button>
        {profile?.id && organisation?.id && (
          <CartSheet
            profileId={profile.id}
            orgId={organisation.id}
            refreshKey={cartRefreshKey}
          />
        )}
      </div>

      <ProductDetail
        product={product}
        profileId={profile!.id}
        orgId={organisation!.id}
        onCartUpdate={() => setCartRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
