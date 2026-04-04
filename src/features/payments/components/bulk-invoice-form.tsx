'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Users } from 'lucide-react';
import { bulkInvoiceSchema } from '@/features/payments/schemas/payment-schemas';
import type { BulkInvoiceInput } from '@/features/payments/schemas/payment-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PAYMENT_TYPE_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import type { MemberWithProfile } from '@/features/members/types/member-types';

interface BulkInvoiceFormProps {
  onSubmit: (data: BulkInvoiceInput) => Promise<void>;
  loading?: boolean;
  members: MemberWithProfile[];
}

export function BulkInvoiceForm({ onSubmit, loading = false, members }: BulkInvoiceFormProps) {
  const [selectAll, setSelectAll] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BulkInvoiceInput>({
    resolver: zodResolver(bulkInvoiceSchema),
    defaultValues: {
      memberIds: [],
      description: '',
      amount: undefined,
      paymentType: undefined,
      dueDate: '',
    },
  });

  const memberIds = watch('memberIds');
  const paymentType = watch('paymentType');
  const amount = watch('amount');

  function toggleMember(id: string) {
    const current = memberIds ?? [];
    const updated = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    setValue('memberIds', updated, { shouldValidate: true });
  }

  function handleSelectAll(checked: boolean) {
    setSelectAll(checked);
    setValue(
      'memberIds',
      checked ? members.map((m) => m.id) : [],
      { shouldValidate: true }
    );
  }

  const selectedCount = memberIds?.length ?? 0;
  const totalValueCents = amount && selectedCount > 0 ? amount * selectedCount * 100 : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Member selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Select Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-2 rounded border bg-muted/40 px-3 py-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <Label htmlFor="select-all" className="cursor-pointer font-medium">
              Select all members ({members.length})
            </Label>
          </div>

          {errors.memberIds && (
            <p className="text-xs text-destructive">{errors.memberIds.message}</p>
          )}

          <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
            {members.map((m) => {
              const isChecked = memberIds?.includes(m.id) ?? false;
              return (
                <div
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                  onClick={() => toggleMember(m.id)}
                >
                  <Checkbox
                    id={`member-${m.id}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleMember(m.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label htmlFor={`member-${m.id}`} className="cursor-pointer text-sm font-normal">
                    {m.profile.first_name} {m.profile.last_name}
                    {m.profile.email && (
                      <span className="ml-1 text-muted-foreground">— {m.profile.email}</span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoice details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Description */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bulk-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bulk-description"
              {...register('description')}
              placeholder="e.g. Annual membership fee 2026"
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="bulk-amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="bulk-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-7"
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Payment type */}
          <div className="space-y-2">
            <Label htmlFor="bulk-paymentType">
              Payment Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={paymentType}
              onValueChange={(val) =>
                setValue('paymentType', val as BulkInvoiceInput['paymentType'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="bulk-paymentType" aria-invalid={!!errors.paymentType}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentType && (
              <p className="text-xs text-destructive">{errors.paymentType.message}</p>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label htmlFor="bulk-dueDate">
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bulk-dueDate"
              type="date"
              {...register('dueDate')}
              aria-invalid={!!errors.dueDate}
            />
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedCount > 0 && amount > 0 && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{selectedCount}</Badge>
              <span className="text-muted-foreground">
                invoice{selectedCount !== 1 ? 's' : ''} to be created
              </span>
            </div>
            <div className="text-sm font-medium">
              Total value:{' '}
              <span className="text-foreground">{formatCurrency(totalValueCents)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading || selectedCount === 0}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading
            ? 'Creating...'
            : `Create ${selectedCount > 0 ? selectedCount : ''} Invoice${selectedCount !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  );
}
