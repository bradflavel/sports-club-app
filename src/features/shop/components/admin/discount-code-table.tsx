'use client';

import { Trash2, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import type { DiscountCode } from '@/lib/supabase/database.types';

interface DiscountCodeTableProps {
  codes: DiscountCode[];
  onDeactivate: (codeId: string) => void;
  deactivatingId?: string | null;
}

export function DiscountCodeTable({ codes, onDeactivate, deactivatingId }: DiscountCodeTableProps) {
  if (codes.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No discount codes"
        description="Create discount codes to offer promotions to your members."
        actionLabel="Create Code"
        actionHref="/shop/admin/discounts/new"
      />
    );
  }

  return (
    <div className="space-y-2">
      {codes.map((code) => {
        const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
        const isMaxedOut = code.max_uses !== null && code.times_used >= code.max_uses;

        return (
          <Card key={code.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{code.code}</span>
                  {!code.is_active && <Badge variant="secondary">Inactive</Badge>}
                  {isExpired && <Badge variant="destructive">Expired</Badge>}
                  {isMaxedOut && <Badge variant="secondary">Limit Reached</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>
                    {code.discount_type === 'percentage'
                      ? `${code.discount_value / 100}% off`
                      : `$${(code.discount_value / 100).toFixed(2)} off`}
                  </span>
                  <span>
                    Used {code.times_used}
                    {code.max_uses !== null ? `/${code.max_uses}` : ''} times
                  </span>
                </div>
                {code.description && (
                  <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                )}
              </div>
              {code.is_active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeactivate(code.id)}
                  disabled={deactivatingId === code.id}
                >
                  {deactivatingId === code.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
