'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryForm } from '@/features/shop/components/admin/category-form';
import { CategoryList } from '@/features/shop/components/admin/category-list';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/features/shop/services/shop-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { CategoryInput } from '@/features/shop/schemas/product-schemas';
import type { ProductCategory } from '@/lib/supabase/database.types';

export default function CategoriesPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchCategories = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    const { data, error } = await getCategories(organisation.id);
    if (!error) setCategories(data);
    setLoading(false);
  }, [organisation?.id]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchCategories();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchCategories]);

  const handleCreate = async (data: CategoryInput) => {
    if (!organisation?.id) return;
    setSaving(true);
    const { error } = await createCategory({
      organisation_id: organisation.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      sort_order: data.sortOrder ?? 0,
      is_active: data.isActive ?? true,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category created' });
      setShowForm(false);
      fetchCategories();
    }
    setSaving(false);
  };

  const handleUpdate = async (data: CategoryInput) => {
    if (!editing) return;
    setSaving(true);
    const { error } = await updateCategory(editing.id, {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      sort_order: data.sortOrder ?? 0,
      is_active: data.isActive ?? true,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category updated' });
      setEditing(null);
      fetchCategories();
    }
    setSaving(false);
  };

  const handleDelete = async (categoryId: string) => {
    setDeletingId(categoryId);
    const { error } = await deleteCategory(categoryId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category deleted' });
      fetchCategories();
    }
    setDeletingId(null);
  };

  if (orgLoading || userLoading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to Shop Admin
        </Link>
      </Button>

      <PageHeader
        title="Categories"
        actions={
          !showForm && !editing ? (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          ) : undefined
        }
      />

      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editing ? 'Edit Category' : 'New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm
              defaultValues={
                editing
                  ? {
                      name: editing.name,
                      slug: editing.slug,
                      description: editing.description ?? undefined,
                      sortOrder: editing.sort_order,
                      isActive: editing.is_active,
                    }
                  : undefined
              }
              onSubmit={editing ? handleUpdate : handleCreate}
              loading={saving}
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onEdit={(cat) => {
            setEditing(cat);
            setShowForm(false);
          }}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
