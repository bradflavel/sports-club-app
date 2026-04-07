'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { StockBadge, getStockLabel } from './stock-badge';
import type { ProductWithCategory, ProductVariant } from '@/lib/supabase/database.types';

interface ProductCardProps {
  product: ProductWithCategory;
  totalStock?: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductCard({ product, totalStock = 0 }: ProductCardProps) {
  const stockLabel = getStockLabel(totalStock, product.low_stock_threshold, product.is_preorder);
  const hasDiscount = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;

  return (
    <Link href={`/shop/${product.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square bg-muted">
          {product.image_urls.length > 0 ? (
            <Image
              src={product.image_urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-4xl">
                {product.product_type === 'digital' ? '📄' : '📦'}
              </span>
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                Sale
              </span>
            )}
            {product.product_type === 'digital' && (
              <span className="rounded bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                Digital
              </span>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {product.category && (
            <p className="text-xs text-muted-foreground">{product.category.name}</p>
          )}
          <h3 className="mt-1 font-semibold leading-tight">{product.name}</h3>

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className="font-bold">{formatPrice(product.price_cents)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_cents!)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mt-2">
            <StockBadge
              stockQuantity={totalStock}
              lowStockThreshold={product.low_stock_threshold}
              isPreorder={product.is_preorder}
              preorderAvailableDate={product.preorder_available_date}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
