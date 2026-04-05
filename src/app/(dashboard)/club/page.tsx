'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Pencil, Eye, CheckCircle, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ClubProfileView } from '@/features/club-profile/components/club-profile-view';
import { ClubDetailsForm } from '@/features/club-profile/components/club-details-form';
import { ClubContactForm } from '@/features/club-profile/components/club-contact-form';
import { ClubVenuesManager } from '@/features/club-profile/components/club-venues-manager';
import { ClubAffiliationsForm } from '@/features/club-profile/components/club-affiliations-form';
import { ClubMembershipConfig } from '@/features/club-profile/components/club-membership-config';
import { ClubFinancialsForm } from '@/features/club-profile/components/club-financials-form';
import { ClubLegalForm } from '@/features/club-profile/components/club-legal-form';
import { ClubReviewReminder } from '@/features/club-profile/components/club-review-reminder';
import type { ClubVenue, MembershipFeeSchedule } from '@/lib/supabase/database.types';

export default function ClubProfilePage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';
  const isEditMode = searchParams.get('edit') === 'true';
  const defaultTab = searchParams.get('tab') || 'details';

  const [memberPreview, setMemberPreview] = useState(false);
  const [venues, setVenues] = useState<ClubVenue[]>([]);
  const [feeSchedule, setFeeSchedule] = useState<MembershipFeeSchedule[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organisation) return;
    setDataLoading(true);
    const supabase = createClient();

    const [venueResult, feeResult] = await Promise.all([
      supabase
        .from('club_venues')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true }),
      supabase
        .from('membership_fee_schedule')
        .select('*')
        .eq('organisation_id', organisation.id),
    ]);

    setVenues((venueResult.data ?? []) as ClubVenue[]);
    setFeeSchedule((feeResult.data ?? []) as MembershipFeeSchedule[]);
    setDataLoading(false);
  }, [organisation]);

  useEffect(() => {
    if (organisation) {
      fetchData();
    }
  }, [organisation, fetchData]);

  const handleConfirmReviewed = async () => {
    if (!organisation) return;
    setConfirmLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('organisations')
      .update({
        details_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organisation.id);

    setConfirmLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Club details confirmed as up to date' });
      router.push('/club');
    }
  };

  if (userLoading || orgLoading) {
    return <PageSkeleton />;
  }

  if (!organisation) {
    return (
      <div className="space-y-6">
        <PageHeader title="Club Profile" />
        <p className="text-muted-foreground">No organisation found.</p>
      </div>
    );
  }

  // Member preview mode (admin viewing as member)
  if (memberPreview) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center justify-between dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <span>You are viewing the member preview</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMemberPreview(false)}
          >
            Back to Admin View
          </Button>
        </div>
        <PageHeader title="Club Profile" />
        <ClubProfileView
          organisation={organisation}
          venues={venues}
          feeSchedule={feeSchedule}
          isAdmin={false}
        />
      </div>
    );
  }

  // Non-admin member view
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Club Profile" />
        {dataLoading ? (
          <PageSkeleton />
        ) : (
          <ClubProfileView
            organisation={organisation}
            venues={venues}
            feeSchedule={feeSchedule}
            isAdmin={false}
          />
        )}
      </div>
    );
  }

  // Admin edit mode
  if (isEditMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Club Profile"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberPreview(true)}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                View as Member
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/club')}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Club
              </Button>
            </div>
          }
        />

        <ClubReviewReminder organisation={organisation} />

        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="affiliations">Affiliations</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ClubDetailsForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="contact">
            <ClubContactForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="venues">
            <ClubVenuesManager
              orgId={organisation.id}
              venues={venues}
              onChanged={fetchData}
            />
          </TabsContent>
          <TabsContent value="affiliations">
            <ClubAffiliationsForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="membership">
            <ClubMembershipConfig
              organisation={organisation}
              feeSchedule={feeSchedule}
              onChanged={fetchData}
            />
          </TabsContent>
          <TabsContent value="financials">
            <ClubFinancialsForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="legal">
            <ClubLegalForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleConfirmReviewed}
            disabled={confirmLoading}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            {confirmLoading ? 'Confirming...' : 'Confirm Details Are Up to Date'}
          </Button>
        </div>
      </div>
    );
  }

  // Admin read mode (default)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Club Profile"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemberPreview(true)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              View as Member
            </Button>
            <Button size="sm" onClick={() => router.push('/club?edit=true')}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <ClubReviewReminder organisation={organisation} />

      {dataLoading ? (
        <PageSkeleton />
      ) : (
        <>
          <ClubProfileView
            organisation={organisation}
            venues={venues}
            feeSchedule={feeSchedule}
            isAdmin={true}
          />
        </>
      )}
    </div>
  );
}
