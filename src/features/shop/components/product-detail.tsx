'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VariantSelector } from './variant-selector';
import { StockBadge, getStockLabel } from './stock-badge';
import { addToCart } from '../services/cart-service';
import { useToast } from '@/components/ui/use-toast';
import type { ProductWithVariants } from '@/lib/supabase/database.types';

interface ProductDetailProps {
  product: ProductWithVariants;
  profileId: string;
  orgId: string;
  onCartUpdate?: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductDetail({ product, profileId, orgId, onCartUpdate }: ProductDetailProps) {
  const { toast } = useToast();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  const stockLabel = getStockLabel(
    selectedVariant?.stock_quantity ?? totalStock,
    product.low_stock_threshold,
    product.is_preorder
  );

  const canAddToCart =
    selectedVariant &&
    (stockLabel !== 'sold_out' || product.is_preorder) &&
    quantity > 0;

  const hasDiscount = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;

  async function handleAddToCart() {
    if (!canAddToCart || !selectedVariant) return;
    setAdding(true);

    const { error } = await addToCart(profileId, orgId, product.id, selectedVariant.id, quantity);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
    } else {
      toast({ title: 'Added to cart', description: `${product.name} x${quantity}` });
      onCartUpdate?.();
    }
    setAdding(false);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Images */}
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {product.image_urls.length > 0 ? (
            <Image
              src={product.image_urls[selectedImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-6xl">
                {product.product_type === 'digital' ? '📄' : '📦'}
              </span>
            </div>
          )}
        </div>
        {product.image_urls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.image_urls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImageIndex(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                  i === selectedImageIndex ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Image src={url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        {product.category && (
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
        )}

        <h1 className="text-2xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{formatPrice(product.price_cents)}</span>
          {hasDiscount && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.compare_at_price_cents!)}
            </span>
          )}
          {hasDiscount && (
            <Badge variant="destructive">
              {Math.round(
                ((product.compare_at_price_cents! - product.price_cents) /
                  product.compare_at_price_cents!) *
                  100
              )}
              % off
            </Badge>
          )}
        </div>

        {product.product_type === 'digital' && (
          <Badge variant="secondary">Digital Download</Badge>
        )}

        <StockBadge
          stockQuantity={selectedVariant?.stock_quantity ?? totalStock}
          lowStockThreshold={product.low_stock_threshold}
          isPreorder={product.is_preorder}
          preorderAvailableDate={product.preorder_available_date}
        />

        {product.description && (
          <p className="text-muted-foreground">{product.description}</p>
        )}

        {/* Variant selector */}
        <VariantSelector
          variants={product.variants}
          selectedVariantId={selectedVariantId}
          onSelect={(variant) => setSelectedVariantId(variant.id)}
        />

        {/* Quantity */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quantity</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add to cart */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleAddToCart}
          disabled={!canAddToCart || adding}
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {stockLabel === 'sold_out' && !product.is_preorder
            ? 'Sold Out'
            : product.is_preorder
              ? 'Pre-order Now'
              : 'Add to Cart'}
        </Button>

        {!selectedVariant && product.variants.length > 1 && (
          <p className="text-sm text-muted-foreground">Please select a variant above</p>
        )}
      </div>
    </div>
  );
}
