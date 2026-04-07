'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/lib/supabase/database.types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
  const colours = [...new Set(variants.map((v) => v.colour).filter(Boolean))] as string[];

  if (variants.length <= 1 && !sizes.length && !colours.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find(
                (v) => v.size === size && (selectedVariantId ? v.colour === variants.find((sv) => sv.id === selectedVariantId)?.colour : true)
              );
              const isSelected = variant?.id === selectedVariantId;
              const isOutOfStock = variant ? variant.stock_quantity <= 0 : true;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => variant && onSelect(variant)}
                  disabled={isOutOfStock && !variant}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted',
                    isOutOfStock && !isSelected && 'opacity-50 line-through'
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colours.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Colour</p>
          <div className="flex flex-wrap gap-2">
            {colours.map((colour) => {
              const variant = variants.find(
                (v) => v.colour === colour && (selectedVariantId ? v.size === variants.find((sv) => sv.id === selectedVariantId)?.size : true)
              );
              const isSelected = variant?.id === selectedVariantId;

              return (
                <button
                  key={colour}
                  type="button"
                  onClick={() => variant && onSelect(variant)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  {colour}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
