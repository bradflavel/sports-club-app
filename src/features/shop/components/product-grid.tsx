'use client';

import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from './product-card';
import type { ProductWithCategory } from '@/lib/supabase/database.types';

interface ProductGridProps {
  products: ProductWithCategory[];
  stockMap?: Map<string, number>;
}

export function ProductGrid({ products, stockMap }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No products found"
        description="There are no products available at the moment. Check back later!"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          totalStock={stockMap?.get(product.id) ?? 0}
        />
      ))}
    </div>
  );
}
