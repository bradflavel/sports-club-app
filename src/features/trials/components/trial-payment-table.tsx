'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { PaymentWithMember, PaymentStatus } from '@/lib/supabase/database.types';

interface TrialPaymentTableProps {
  activityId: string;
  orgId: string;
}

const STATUS_VARIANTS: Record<PaymentStatus, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'outline',
  refunded: 'outline',
};

export function TrialPaymentTable({ activityId, orgId }: TrialPaymentTableProps) {
  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Get trial fee payments for this org
    // We filter by description pattern since payments don't directly link to activities
    const { data } = await supabase
      .from('payments')
      .select('*, member:members(*, profile:profiles(*))')
      .eq('organisation_id', orgId)
      .eq('payment_type', 'trial_fee')
      .order('created_at', { ascending: false });

    setPayments((data as unknown as PaymentWithMember[]) ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  async function markAsPaid(paymentId: string) {
    const supabase = createClient();
    await supabase
      .from('payments')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    fetchPayments();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No trial fee invoices yet. Configure fees and generate invoices above.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Member</th>
            <th className="px-3 py-2 text-left font-medium">Description</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b last:border-0">
              <td className="px-3 py-2">
                {payment.member.profile.first_name} {payment.member.profile.last_name}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{payment.description}</td>
              <td className="px-3 py-2 text-right">
                ${(payment.amount_cents / 100).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center">
                <Badge variant={STATUS_VARIANTS[payment.payment_status]} className="text-xs capitalize">
                  {payment.payment_status}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right">
                {payment.payment_status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => markAsPaid(payment.id)}
                  >
                    Mark Paid
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
