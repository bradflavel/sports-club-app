'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { paymentSchema } from '@/features/payments/schemas/payment-schemas';
import type { PaymentInput } from '@/features/payments/schemas/payment-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAYMENT_TYPE_OPTIONS } from '@/lib/constants';
import type { MemberWithProfile } from '@/features/members/types/member-types';

interface InvoiceFormProps {
  defaultValues?: Partial<PaymentInput>;
  onSubmit: (data: PaymentInput) => Promise<void>;
  loading?: boolean;
  members: MemberWithProfile[];
}

export function InvoiceForm({
  defaultValues,
  onSubmit,
  loading = false,
  members,
}: InvoiceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      memberId: '',
      description: '',
      amount: undefined,
      paymentType: undefined,
      dueDate: '',
      ...defaultValues,
    },
  });

  const memberId = watch('memberId');
  const paymentType = watch('paymentType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Member */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="memberId">
              Member <span className="text-destructive">*</span>
            </Label>
            <Select
              value={memberId}
              onValueChange={(val) =>
                setValue('memberId', val, { shouldValidate: true })
              }
            >
              <SelectTrigger id="memberId" aria-invalid={!!errors.memberId}>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.profile.first_name} {m.profile.last_name}
                    {m.profile.email ? ` — ${m.profile.email}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.memberId && (
              <p className="text-xs text-destructive">{errors.memberId.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
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
            <Label htmlFor="amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
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

          {/* Payment Type */}
          <div className="space-y-2">
            <Label htmlFor="paymentType">
              Payment Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={paymentType}
              onValueChange={(val) =>
                setValue('paymentType', val as PaymentInput['paymentType'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="paymentType" aria-invalid={!!errors.paymentType}>
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

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dueDate"
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

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.memberId ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
