'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { InvoiceForm } from '@/features/payments/components/invoice-form';
import { BulkInvoiceForm } from '@/features/payments/components/bulk-invoice-form';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useAuth } from '@/hooks/use-auth-context';
import { useToast } from '@/components/ui/use-toast';
import { dollarsToCents } from '@/lib/format';
import type { PaymentInput, BulkInvoiceInput } from '@/features/payments/schemas/payment-schemas';
import type { MemberWithProfile } from '@/features/members/types/member-types';
import type { PaymentType } from '@/lib/supabase/database.types';

type Mode = 'single' | 'bulk';

export default function NewPaymentPage() {
  const router = useRouter();
  const { organisation } = useOrganisation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>('single');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!organisation?.id) return;
    setMembersLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('organisation_id', organisation.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading members', description: error.message, variant: 'destructive' });
    } else {
      setMembers((data as unknown as MemberWithProfile[]) ?? []);
    }

    setMembersLoading(false);
  }, [organisation?.id, toast]);

  useEffect(() => {
    if (organisation?.id) {
      fetchMembers();
    }
  }, [organisation?.id, fetchMembers]);

  async function handleSingleSubmit(data: PaymentInput) {
    if (!organisation?.id || !user?.id) {
      toast({ title: 'Error', description: 'Organisation or user not found.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('payments').insert({
        organisation_id: organisation.id,
        member_id: data.memberId,
        amount_cents: dollarsToCents(data.amount),
        description: data.description,
        payment_type: data.paymentType as PaymentType,
        payment_status: 'pending',
        due_date: data.dueDate,
        paid_at: null,
        stripe_payment_intent_id: null,
        created_by: user.id,
      });

      if (error) throw new Error(error.message);

      toast({ title: 'Invoice created successfully' });
      router.push('/payments');
    } catch (err) {
      toast({
        title: 'Error creating invoice',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkSubmit(data: BulkInvoiceInput) {
    if (!organisation?.id || !user?.id) {
      toast({ title: 'Error', description: 'Organisation or user not found.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const amountCents = dollarsToCents(data.amount);

      const rows = data.memberIds.map((memberId) => ({
        organisation_id: organisation.id,
        member_id: memberId,
        amount_cents: amountCents,
        description: data.description,
        payment_type: data.paymentType as PaymentType,
        payment_status: 'pending' as const,
        due_date: data.dueDate,
        paid_at: null,
        stripe_payment_intent_id: null,
        created_by: user.id,
      }));

      const { error } = await supabase.from('payments').insert(rows);

      if (error) throw new Error(error.message);

      toast({
        title: `${rows.length} invoice${rows.length !== 1 ? 's' : ''} created successfully`,
      });
      router.push('/payments');
    } catch (err) {
      toast({
        title: 'Error creating invoices',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        actions={
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/payments">
              <ArrowLeft className="h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
        }
      />

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          Single Invoice
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'bulk'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Bulk Invoice
        </button>
      </div>

      <div className="mx-auto max-w-3xl">
        {membersLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : mode === 'single' ? (
          <InvoiceForm onSubmit={handleSingleSubmit} loading={loading} members={members} />
        ) : (
          <BulkInvoiceForm onSubmit={handleBulkSubmit} loading={loading} members={members} />
        )}
      </div>
    </div>
  );
}
