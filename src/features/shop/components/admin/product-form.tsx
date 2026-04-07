'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from './image-upload';
import { DigitalFileUpload } from './digital-file-upload';
import { productSchema, type ProductInput, type ProductVariantInput } from '../../schemas/product-schemas';
import type { ProductCategory, ProductVariant } from '@/lib/supabase/database.types';

interface ProductFormProps {
  orgId: string;
  categories: ProductCategory[];
  defaultValues?: Partial<ProductInput>;
  existingVariants?: ProductVariant[];
  existingImageUrls?: string[];
  existingDigitalFileUrls?: string[];
  onSubmit: (
    data: ProductInput,
    variants: ProductVariantInput[],
    imageUrls: string[],
    digitalFileUrls: string[]
  ) => Promise<void>;
  loading?: boolean;
}

export function ProductForm({
  orgId,
  categories,
  defaultValues,
  existingVariants,
  existingImageUrls = [],
  existingDigitalFileUrls = [],
  onSubmit,
  loading,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      productType: 'physical',
      priceCents: 0,
      isActive: true,
      isRestricted: false,
      isPreorder: false,
      lowStockThreshold: 5,
      sortOrder: 0,
      ...defaultValues,
    },
  });

  const productType = watch('productType');
  const isPreorder = watch('isPreorder');
  const name = watch('name');

  const [imageUrls, setImageUrls] = useState<string[]>(existingImageUrls);
  const [digitalFileUrls, setDigitalFileUrls] = useState<string[]>(existingDigitalFileUrls);
  const [variants, setVariants] = useState<ProductVariantInput[]>(
    existingVariants?.map((v) => ({
      size: v.size ?? undefined,
      colour: v.colour ?? undefined,
      sku: v.sku ?? undefined,
      stockQuantity: v.stock_quantity,
      isActive: v.is_active,
      sortOrder: v.sort_order,
    })) ?? [{ stockQuantity: 0, isActive: true, sortOrder: 0 }]
  );

  function generateSlug() {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setValue('slug', slug);
  }

  function addVariant() {
    setVariants([...variants, { stockQuantity: 0, isActive: true, sortOrder: variants.length }]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof ProductVariantInput, value: unknown) {
    const updated = [...variants];
    (updated[index] as Record<string, unknown>)[field] = value;
    setVariants(updated);
  }

  function onFormSubmit(data: ProductInput) {
    onSubmit(data, variants, imageUrls, digitalFileUrls);
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" {...register('name')} onBlur={generateSlug} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
              <Input id="slug" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Product Type</Label>
              <Select
                value={productType}
                onValueChange={(v) => setValue('productType', v as 'physical' | 'digital')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={watch('categoryId') ?? ''}
                onValueChange={(v) => setValue('categoryId', v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="priceCents">Price (cents) <span className="text-destructive">*</span></Label>
              <Input id="priceCents" type="number" {...register('priceCents')} />
              {errors.priceCents && <p className="text-xs text-destructive">{errors.priceCents.message}</p>}
              <p className="text-xs text-muted-foreground">
                e.g. 2500 = $25.00
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compareAtPriceCents">Compare At Price (cents)</Label>
              <Input id="compareAtPriceCents" type="number" {...register('compareAtPriceCents')} />
              <p className="text-xs text-muted-foreground">
                Original price for &quot;was $X&quot; display
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload orgId={orgId} imageUrls={imageUrls} onImagesChange={setImageUrls} />
        </CardContent>
      </Card>

      {/* Digital Files */}
      {productType === 'digital' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Digital Files</CardTitle>
          </CardHeader>
          <CardContent>
            <DigitalFileUpload
              orgId={orgId}
              fileUrls={digitalFileUrls}
              onFilesChange={setDigitalFileUrls}
            />
          </CardContent>
        </Card>
      )}

      {/* Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {productType === 'digital' ? 'Variants (optional)' : 'Variants'}
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="mr-1 h-4 w-4" /> Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant, i) => (
            <div key={i} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Variant {i + 1}</p>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeVariant(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    value={variant.size ?? ''}
                    onChange={(e) => updateVariant(i, 'size', e.target.value || undefined)}
                    placeholder="e.g. M"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Colour</Label>
                  <Input
                    value={variant.colour ?? ''}
                    onChange={(e) => updateVariant(i, 'colour', e.target.value || undefined)}
                    placeholder="e.g. Navy"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stock Qty</Label>
                  <Input
                    type="number"
                    value={variant.stockQuantity}
                    onChange={(e) => updateVariant(i, 'stockQuantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={variant.sku ?? ''}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value || undefined)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Product is visible in the shop</p>
            </div>
            <Switch
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Restricted Access</Label>
              <p className="text-xs text-muted-foreground">Only available to specific roles/teams</p>
            </div>
            <Switch
              checked={watch('isRestricted')}
              onCheckedChange={(checked) => setValue('isRestricted', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Pre-order</Label>
              <p className="text-xs text-muted-foreground">Accept orders before stock is available</p>
            </div>
            <Switch
              checked={isPreorder}
              onCheckedChange={(checked) => setValue('isPreorder', checked)}
            />
          </div>

          {isPreorder && (
            <div className="space-y-1.5 pl-4">
              <Label htmlFor="preorderAvailableDate">Expected Available Date</Label>
              <Input
                id="preorderAvailableDate"
                type="date"
                {...register('preorderAvailableDate')}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              {...register('lowStockThreshold')}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Product
      </Button>
    </form>
  );
}
