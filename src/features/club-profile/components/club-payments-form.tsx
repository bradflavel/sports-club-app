'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { Organisation } from '@/lib/supabase/database.types';

interface ClubPaymentsFormProps {
  organisation: Organisation;
  stripeStatus?: string | null;
}

export function ClubPaymentsForm({ organisation, stripeStatus }: ClubPaymentsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const hasAccount = !!organisation.stripe_account_id;
  const isComplete = !!organisation.stripe_onboarding_complete;

  // Show toast based on return from Stripe onboarding
  if (stripeStatus === 'success') {
    toast({ title: 'Stripe connected successfully!' });
  } else if (stripeStatus === 'pending') {
    toast({
      title: 'Stripe onboarding incomplete',
      description: 'Please complete all required steps in Stripe to accept payments.',
      variant: 'destructive',
    });
  } else if (stripeStatus === 'refresh') {
    toast({
      title: 'Onboarding session expired',
      description: 'Click the button below to continue setting up Stripe.',
    });
  }

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.url) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to start Stripe onboarding.',
          variant: 'destructive',
        });
        return;
      }

      // Redirect to Stripe's hosted onboarding
      window.location.href = data.url;
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Payment Processing</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a Stripe account to accept payments through your club shop.
          Each payment goes directly to your club&apos;s bank account.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {isComplete ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Stripe Connected</p>
                <p className="text-sm text-muted-foreground">
                  Your club can accept payments.
                </p>
              </div>
            </>
          ) : hasAccount ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Setup Incomplete</p>
                <p className="text-sm text-muted-foreground">
                  Complete your Stripe account setup to start accepting payments.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No Payment Account</p>
                <p className="text-sm text-muted-foreground">
                  Connect a Stripe account to enable shop payments.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        {isComplete ? (
          <Button variant="outline" size="sm" onClick={handleConnect} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Manage Stripe Account
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasAccount ? 'Complete Stripe Setup' : 'Connect Stripe Account'}
          </Button>
        )}
      </div>
    </div>
  );
}
