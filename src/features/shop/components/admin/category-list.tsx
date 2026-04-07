'use client';

import { useState } from 'react';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ProductCategory } from '@/lib/supabase/database.types';

interface CategoryListProps {
  categories: ProductCategory[];
  onEdit: (category: ProductCategory) => void;
  onDelete: (categoryId: string) => void;
  deletingId?: string | null;
}

export function CategoryList({ categories, onEdit, onDelete, deletingId }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No categories yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <Card key={cat.id}>
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-6 text-center">
                {cat.sort_order}
              </span>
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">/{cat.slug}</p>
              </div>
              {!cat.is_active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cat)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(cat.id)}
                disabled={deletingId === cat.id}
              >
                {deletingId === cat.id ? (
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
