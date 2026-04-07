'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Settings, ShoppingBag } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/features/shop/components/product-grid';
import { CartSheet } from '@/features/shop/components/cart-sheet';
import { getProducts, getCategories } from '@/features/shop/services/shop-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { ProductWithCategory, ProductCategory } from '@/lib/supabase/database.types';

export default function ShopPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cartRefreshKey, setCartRefreshKey] = useState(0);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const [productsResult, categoriesResult] = await Promise.all([
      getProducts(organisation.id, {
        search: search || undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
      }),
      getCategories(organisation.id),
    ]);

    if (productsResult.error) {
      toast({ title: 'Error loading products', description: productsResult.error.message, variant: 'destructive' });
    } else {
      // Filter out inactive for non-admins
      const visible = isAdmin
        ? productsResult.data
        : productsResult.data.filter((p) => p.is_active);
      setProducts(visible);
    }

    if (!categoriesResult.error) {
      setCategories(categoriesResult.data);
    }

    // Fetch stock totals
    if (productsResult.data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const productIds = productsResult.data.map((p) => p.id);
      const { data: variants } = await supabase
        .from('product_variants')
        .select('product_id, stock_quantity')
        .in('product_id', productIds)
        .eq('is_active', true);

      const map = new Map<string, number>();
      for (const v of variants ?? []) {
        const productId = v.product_id as string;
        map.set(productId, (map.get(productId) ?? 0) + (v.stock_quantity as number));
      }
      setStockMap(map);
    }

    setLoading(false);
  }, [organisation?.id, search, categoryFilter, isAdmin, toast]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchData();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchData]);

  if (orgLoading || userLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop"
        description="Club merchandise and products"
        actions={
          <div className="flex items-center gap-2">
            {profile?.id && organisation?.id && (
              <CartSheet
                profileId={profile.id}
                orgId={organisation.id}
                refreshKey={cartRefreshKey}
              />
            )}
            {isAdmin && (
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/shop/admin">
                  <Settings className="h-4 w-4" />
                  Manage
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search products..."
          onSearch={setSearch}
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <ProductGrid products={products} stockMap={stockMap} />
      )}
    </div>
  );
}
