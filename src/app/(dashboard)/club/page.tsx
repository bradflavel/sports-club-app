'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { differenceInMonths } from 'date-fns';
import { Pencil, Eye, CheckCircle, ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { ModuleSettings } from '@/features/activities/components/module-settings';
import { useEnabledModules } from '@/hooks/use-enabled-modules';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { ClubVenue, MembershipTypeRecord } from '@/lib/supabase/database.types';

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
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
  const [dangerExpanded, setDangerExpanded] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const detailsSaveRef = useRef<(() => Promise<void>) | null>(null);
  const { modules, refetch: refetchModules } = useEnabledModules();

  const fetchData = useCallback(async () => {
    if (!organisation) return;
    setDataLoading(true);
    const supabase = createClient();

    const [venueResult, typesResult] = await Promise.all([
      supabase
        .from('club_venues')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true }),
      supabase
        .from('membership_types')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('display_order'),
    ]);

    setVenues((venueResult.data ?? []) as ClubVenue[]);
    setMembershipTypes((typesResult.data ?? []) as MembershipTypeRecord[]);
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
          membershipTypes={membershipTypes}
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
            membershipTypes={membershipTypes}
            isAdmin={false}
          />
        )}
      </div>
    );
  }

  // Admin edit mode
  if (isEditMode) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
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
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1">Contact</TabsTrigger>
            <TabsTrigger value="venues" className="flex-1">Venues</TabsTrigger>
            <TabsTrigger value="affiliations" className="flex-1">Affiliations</TabsTrigger>
            <TabsTrigger value="membership" className="flex-1">Membership</TabsTrigger>
            <TabsTrigger value="financials" className="flex-1">Financials</TabsTrigger>
            <TabsTrigger value="legal" className="flex-1">Legal</TabsTrigger>
            <TabsTrigger value="activities" className="flex-1">Activity Types</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-8 space-y-6">
            <ClubDetailsForm organisation={organisation} onSaved={fetchData} hideSaveButton saveRef={detailsSaveRef} />

            {/* Danger Zone - collapsible */}
            <div className="max-w-md">
              <div className="rounded-lg border border-destructive/30 p-4">
                <button
                  type="button"
                  onClick={() => setDangerExpanded(!dangerExpanded)}
                  className="flex w-full items-center justify-between"
                >
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Irreversible actions
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dangerExpanded ? 'rotate-180' : ''}`} />
                </button>
                {dangerExpanded && (
                  <div className="mt-3 border-t border-destructive/20 pt-3">
                    <p className="text-xs text-muted-foreground">
                      Permanently delete this organisation and all its data. This cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => setDeleteOrgOpen(true)}
                    >
                      Delete Organisation
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Save Details - below everything */}
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={detailsSaving}
                onClick={async () => {
                  setDetailsSaving(true);
                  await detailsSaveRef.current?.();
                  setDetailsSaving(false);
                }}
              >
                {detailsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Details
              </Button>
            </div>

            <ConfirmDialog
              open={deleteOrgOpen}
              onOpenChange={setDeleteOrgOpen}
              title="Delete Organisation"
              description="This will permanently delete all data including members, teams, payments, and documents. This cannot be undone."
              variant="destructive"
              confirmLabel="Delete Everything"
              onConfirm={async () => {
                const supabase = createClient();
                await supabase.from('organisations').delete().eq('id', organisation.id);
                window.location.href = '/';
              }}
            />
          </TabsContent>
          <TabsContent value="contact" className="mt-8">
            <ClubContactForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="venues" className="mt-8">
            <ClubVenuesManager
              orgId={organisation.id}
              venues={venues}
              onChanged={fetchData}
            />
          </TabsContent>
          <TabsContent value="affiliations" className="mt-8">
            <ClubAffiliationsForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="membership" className="mt-8">
            <ClubMembershipConfig
              orgId={organisation.id}
              onChanged={fetchData}
            />
          </TabsContent>
          <TabsContent value="financials" className="mt-8">
            <ClubFinancialsForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>
          <TabsContent value="legal" className="mt-8">
            <ClubLegalForm organisation={organisation} onSaved={fetchData} />
          </TabsContent>

          <TabsContent value="activities" className="mt-8 space-y-4">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold mb-1">Activity Types</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable or disable activity types for your club. Enabled types appear in the sidebar.
              </p>
              <ModuleSettings
                orgId={organisation.id}
                modules={modules}
                onModuleChange={() => {
                  refetchModules();
                  router.refresh();
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {organisation.created_at && differenceInMonths(new Date(), new Date(organisation.created_at)) >= 6 && (
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
        )}
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
            membershipTypes={membershipTypes}
            isAdmin={true}
          />
        </>
      )}
    </div>
  );
}
