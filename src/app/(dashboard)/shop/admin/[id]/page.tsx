'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/features/shop/components/admin/product-form';
import {
  getProductById,
  updateProduct,
  getCategories,
  createVariant,
  updateVariant,
  deleteVariant,
} from '@/features/shop/services/shop-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ProductInput, ProductVariantInput } from '@/features/shop/schemas/product-schemas';
import type { ProductCategory, ProductVariant } from '@/lib/supabase/database.types';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [existingVariants, setExistingVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const productId = params.id as string;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const [productResult, categoriesResult] = await Promise.all([
      getProductById(productId),
      getCategories(organisation.id),
    ]);

    if (productResult.data) {
      setProduct(productResult.data as unknown as Record<string, unknown>);
      setExistingVariants(
        (productResult.data as unknown as { variants: ProductVariant[] }).variants ?? []
      );
    }
    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
    }

    setLoading(false);
  }, [productId, organisation?.id]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchData();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchData]);

  const handleSubmit = async (
    data: ProductInput,
    variants: ProductVariantInput[],
    imageUrls: string[],
    digitalFileUrls: string[]
  ) => {
    setSaving(true);

    const { error } = await updateProduct(productId, {
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
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Handle variants: delete removed, update existing, create new
    const existingIds = existingVariants.map((v) => v.id);

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (i < existingVariants.length) {
        // Update existing
        await updateVariant(existingVariants[i].id, {
          size: variant.size ?? null,
          colour: variant.colour ?? null,
          sku: variant.sku ?? null,
          stock_quantity: variant.stockQuantity,
          is_active: variant.isActive ?? true,
          sort_order: variant.sortOrder ?? i,
        });
      } else {
        // Create new
        await createVariant({
          product_id: productId,
          size: variant.size ?? null,
          colour: variant.colour ?? null,
          sku: variant.sku ?? null,
          stock_quantity: variant.stockQuantity,
          is_active: variant.isActive ?? true,
          sort_order: variant.sortOrder ?? i,
        });
      }
    }

    // Delete removed variants
    if (variants.length < existingVariants.length) {
      for (let i = variants.length; i < existingVariants.length; i++) {
        await deleteVariant(existingVariants[i].id);
      }
    }

    toast({ title: 'Product updated!' });
    router.push('/shop/admin');
    setSaving(false);
  };

  if (orgLoading || userLoading || loading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;
  if (!product) return <p className="py-12 text-center text-muted-foreground">Product not found</p>;

  const p = product as unknown as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <PageHeader title="Edit Product" />

      <ProductForm
        orgId={organisation!.id}
        categories={categories}
        defaultValues={{
          name: p.name as string,
          slug: p.slug as string,
          description: (p.description as string) ?? undefined,
          productType: p.product_type as 'physical' | 'digital',
          priceCents: p.price_cents as number,
          compareAtPriceCents: (p.compare_at_price_cents as number) ?? undefined,
          categoryId: (p.category_id as string) ?? undefined,
          isActive: p.is_active as boolean,
          isRestricted: p.is_restricted as boolean,
          isPreorder: p.is_preorder as boolean,
          preorderAvailableDate: (p.preorder_available_date as string) ?? undefined,
          lowStockThreshold: p.low_stock_threshold as number,
          sortOrder: p.sort_order as number,
        }}
        existingVariants={existingVariants}
        existingImageUrls={(p.image_urls as string[]) ?? []}
        existingDigitalFileUrls={(p.digital_file_urls as string[]) ?? []}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </div>
  );
}
