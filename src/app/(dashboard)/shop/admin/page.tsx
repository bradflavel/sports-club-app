'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Tag, FolderOpen, Package } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/features/shop/components/admin/product-table';
import { getProducts, deleteProduct } from '@/features/shop/services/shop-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ProductWithCategory } from '@/lib/supabase/database.types';

export default function ShopAdminPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchProducts = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    const { data, error } = await getProducts(organisation.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, [organisation?.id, toast]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchProducts();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchProducts]);

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    const { error } = await deleteProduct(productId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product deleted' });
      fetchProducts();
    }
    setDeletingId(null);
  };

  if (orgLoading || userLoading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Management"
        description="Manage products, categories, and discount codes"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/shop/admin/categories">
                <FolderOpen className="h-4 w-4" />
                Categories
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/shop/admin/discounts">
                <Tag className="h-4 w-4" />
                Discounts
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/shop/admin/orders">
                <Package className="h-4 w-4" />
                Orders
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/shop/admin/new">
                <Plus className="h-4 w-4" />
                New Product
              </Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <ProductTable
          products={products}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
