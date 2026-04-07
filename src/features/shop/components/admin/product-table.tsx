'use client';

import Link from 'next/link';
import { Edit2, Trash2, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import type { ProductWithCategory } from '@/lib/supabase/database.types';

interface ProductTableProps {
  products: ProductWithCategory[];
  onDelete: (productId: string) => void;
  deletingId?: string | null;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductTable({ products, onDelete, deletingId }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products yet"
        description="Create your first product to start selling."
        actionLabel="Create Product"
        actionHref="/shop/admin/new"
      />
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{product.name}</p>
                  {!product.is_active && <Badge variant="secondary">Inactive</Badge>}
                  {product.is_restricted && <Badge variant="outline">Restricted</Badge>}
                  {product.is_preorder && <Badge variant="outline">Pre-order</Badge>}
                  {product.product_type === 'digital' && <Badge variant="secondary">Digital</Badge>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {product.category && <span>{product.category.name}</span>}
                  <span>{formatPrice(product.price_cents)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/shop/admin/${product.id}`}>
                  <Edit2 className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(product.id)}
                disabled={deletingId === product.id}
              >
                {deletingId === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
