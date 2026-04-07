'use client';

import { Badge } from '@/components/ui/badge';
import type { StockDisplayLabel } from '../types/shop-types';

interface StockBadgeProps {
  stockQuantity: number;
  lowStockThreshold: number;
  isPreorder: boolean;
  preorderAvailableDate?: string | null;
}

export function getStockLabel(
  stockQuantity: number,
  lowStockThreshold: number,
  isPreorder: boolean
): StockDisplayLabel {
  if (isPreorder) return 'preorder';
  if (stockQuantity <= 0) return 'sold_out';
  if (stockQuantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

const BADGE_CONFIG: Record<StockDisplayLabel, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_stock: { label: 'In Stock', variant: 'default' },
  low_stock: { label: 'Low Stock', variant: 'secondary' },
  sold_out: { label: 'Sold Out', variant: 'destructive' },
  preorder: { label: 'Pre-order', variant: 'outline' },
};

export function StockBadge({ stockQuantity, lowStockThreshold, isPreorder, preorderAvailableDate }: StockBadgeProps) {
  const label = getStockLabel(stockQuantity, lowStockThreshold, isPreorder);
  const config = BADGE_CONFIG[label];

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant}>{config.label}</Badge>
      {isPreorder && preorderAvailableDate && (
        <span className="text-xs text-muted-foreground">
          Available {new Date(preorderAvailableDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
