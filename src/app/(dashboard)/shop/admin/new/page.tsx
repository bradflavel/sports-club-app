'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/features/shop/components/admin/product-form';
import { createProduct, createVariant, getCategories } from '@/features/shop/services/shop-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ProductInput, ProductVariantInput } from '@/features/shop/schemas/product-schemas';
import type { ProductCategory } from '@/lib/supabase/database.types';

export default function NewProductPage() {
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  useEffect(() => {
    if (organisation?.id) {
      getCategories(organisation.id).then(({ data }) => setCategories(data));
    }
  }, [organisation?.id]);

  const handleSubmit = async (
    data: ProductInput,
    variants: ProductVariantInput[],
    imageUrls: string[],
    digitalFileUrls: string[]
  ) => {
    if (!organisation?.id || !profile?.id) return;
    setLoading(true);

    const { data: product, error } = await createProduct({
      organisation_id: organisation.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      product_type: data.productType,
      price_cents: data.priceCents,
      compare_at_price_cents: data.compareAtPriceCents ?? null,
      category_id: data.categoryId ?? null,
      image_urls: imageUrls,
      digital_file_urls: digitalFileUrls.length > 0 ? digitalFileUrls : null,
      is_active: data.isActive ?? true,
      is_restricted: data.isRestricted ?? false,
      is_preorder: data.isPreorder ?? false,
      preorder_available_date: data.preorderAvailableDate ?? null,
      low_stock_threshold: data.lowStockThreshold ?? 5,
      sort_order: data.sortOrder ?? 0,
      created_by: profile.id,
    });

    if (error || !product) {
      toast({ title: 'Error', description: error?.message ?? 'Failed to create product', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Create variants
    for (const variant of variants) {
      await createVariant({
        product_id: product.id,
        size: variant.size ?? null,
        colour: variant.colour ?? null,
        sku: variant.sku ?? null,
        stock_quantity: variant.stockQuantity,
        is_active: variant.isActive ?? true,
        sort_order: variant.sortOrder ?? 0,
      });
    }

    toast({ title: 'Product created!' });
    router.push('/shop/admin');
    setLoading(false);
  };

  if (orgLoading || userLoading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <PageHeader title="New Product" />

      <ProductForm
        orgId={organisation!.id}
        categories={categories}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}
