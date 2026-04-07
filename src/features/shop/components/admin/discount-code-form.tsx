'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { discountCodeSchema, type DiscountCodeInput } from '../../schemas/discount-schemas';

interface DiscountCodeFormProps {
  defaultValues?: Partial<DiscountCodeInput>;
  onSubmit: (data: DiscountCodeInput) => Promise<void>;
  loading?: boolean;
}

export function DiscountCodeForm({ defaultValues, onSubmit, loading }: DiscountCodeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DiscountCodeInput>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUsesPerUser: 1,
      isActive: true,
      ...defaultValues,
    },
  });

  const discountType = watch('discountType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
          <Input id="code" {...register('code')} placeholder="e.g. SUMMER20" className="uppercase" />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Discount Type</Label>
          <Select
            value={discountType}
            onValueChange={(v) => setValue('discountType', v as 'percentage' | 'fixed_amount')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="discountValue">
            {discountType === 'percentage' ? 'Discount (basis points)' : 'Discount (cents)'}
            <span className="text-destructive"> *</span>
          </Label>
          <Input id="discountValue" type="number" {...register('discountValue')} />
          {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
          <p className="text-xs text-muted-foreground">
            {discountType === 'percentage'
              ? 'e.g. 1500 = 15%, 2000 = 20%'
              : 'e.g. 500 = $5.00, 1000 = $10.00'}
          </p>
        </div>
        {discountType === 'percentage' && (
          <div className="space-y-1.5">
            <Label htmlFor="maxDiscountCents">Max Discount (cents)</Label>
            <Input id="maxDiscountCents" type="number" {...register('maxDiscountCents')} />
            <p className="text-xs text-muted-foreground">Cap for percentage discounts</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="minOrderCents">Minimum Order (cents)</Label>
          <Input id="minOrderCents" type="number" {...register('minOrderCents')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxUses">Max Total Uses</Label>
          <Input id="maxUses" type="number" {...register('maxUses')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
          <Input id="maxUsesPerUser" type="number" {...register('maxUsesPerUser')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Starts At</Label>
          <Input id="startsAt" type="datetime-local" {...register('startsAt')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">Expires At</Label>
          <Input id="expiresAt" type="datetime-local" {...register('expiresAt')} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={watch('isActive')}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
        <Label>Active</Label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Discount Code
      </Button>
    </form>
  );
}
