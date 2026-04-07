'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EventDetail } from '@/features/club-events/components/event-detail';
import { EventAdminDetail } from '@/features/club-events/components/event-admin-detail';
import { RegistrationDialog } from '@/features/club-events/components/registration-dialog';
import { useAuth } from '@/hooks/use-auth-context';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import {
  getClubEventById,
  getEventRegistrations,
  getMyRegistration,
  getRegistrationCount,
  registerForEvent,
  cancelRegistration,
  approveRegistration,
  markAttended,
  updateClubEvent,
  deleteClubEvent,
} from '@/features/club-events/services/club-event-service';
import type {
  ClubEventWithVenue,
  ClubEventRegistration,
  ClubEventRegistrationWithMember,
  ClubEventStatus,
} from '@/features/club-events/types/club-event-types';
import type { RegistrationInput } from '@/features/club-events/schemas/club-event-schemas';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, user } = useAuth();
  const { organisation } = useOrganisation();
  const { toast } = useToast();

  const [event, setEvent] = useState<ClubEventWithVenue | null>(null);
  const [registration, setRegistration] = useState<ClubEventRegistration | null>(null);
  const [adminRegistrations, setAdminRegistrations] = useState<ClubEventRegistrationWithMember[]>(
    []
  );
  const [registrationCount, setRegistrationCount] = useState(0);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [eventRes, countRes] = await Promise.all([
      getClubEventById(id),
      getRegistrationCount(id),
    ]);

    if (eventRes.error || !eventRes.data) {
      toast({ title: 'Event not found', variant: 'destructive' });
      router.push('/events');
      return;
    }

    setEvent(eventRes.data);
    setRegistrationCount(countRes.count);

    if (isAdmin) {
      const { data: regs } = await getEventRegistrations(id);
      setAdminRegistrations(regs ?? []);
    }

    // Find member record for current user
    if (profile?.id && organisation?.id) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('organisation_id', organisation.id)
        .single();

      if (member) {
        setMemberId(member.id);
        const { data: reg } = await getMyRegistration(id, member.id);
        setRegistration(reg);
      }
    }

    setLoading(false);
  }, [id, isAdmin, profile?.id, organisation?.id, toast, router]);

  useEffect(() => {
    if (profile !== undefined) {
      fetchData();
    }
  }, [fetchData, profile]);

  async function handleRegister(data: RegistrationInput) {
    if (!memberId || !event) return;

    const { error } = await registerForEvent(event.id, memberId, {
      guestCount: data.guestCount,
      guestNames: data.guestNames,
      dietaryRequirements: data.dietaryRequirements,
      notes: data.notes,
    });

    if (error) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Successfully registered!' });
      fetchData();
    }
  }

  async function handleCancelRegistration() {
    if (!registration) return;

    const { error } = await cancelRegistration(registration.id);

    if (error) {
      toast({
        title: 'Error cancelling registration',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Registration cancelled' });
      fetchData();
    }
  }

  async function handleApprove(registrationId: string) {
    const { error } = await approveRegistration(registrationId);
    if (error) {
      toast({ title: 'Error approving registration', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registration approved' });
      fetchData();
    }
  }

  async function handleMarkAttended(registrationId: string) {
    const { error } = await markAttended(registrationId);
    if (error) {
      toast({ title: 'Error marking attendance', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Attendance recorded' });
      fetchData();
    }
  }

  async function handleRemoveRegistration(registrationId: string) {
    const { error } = await cancelRegistration(registrationId);
    if (error) {
      toast({ title: 'Error removing registration', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registration removed' });
      fetchData();
    }
  }

  async function handleStatusChange(status: ClubEventStatus) {
    if (!event) return;
    const { error } = await updateClubEvent(event.id, { status });
    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status updated' });
      fetchData();
    }
  }

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    const { error } = await deleteClubEvent(event.id);
    if (error) {
      toast({ title: 'Error deleting event', description: error.message, variant: 'destructive' });
      setDeleting(false);
    } else {
      toast({ title: 'Event deleted' });
      router.push('/events');
    }
  }

  function handleEdit() {
    router.push(`/events/${id}/edit`);
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!event) return null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </Button>
      </div>

      {isAdmin ? (
        <EventAdminDetail
          event={event}
          registrations={adminRegistrations}
          registrationCount={registrationCount}
          onEdit={handleEdit}
          onDelete={() => setDeleteDialogOpen(true)}
          onStatusChange={handleStatusChange}
          onApprove={handleApprove}
          onMarkAttended={handleMarkAttended}
          onRemoveRegistration={handleRemoveRegistration}
        />
      ) : (
        <EventDetail
          event={event}
          registration={registration}
          registrationCount={registrationCount}
          memberId={memberId}
          onRegister={() => setRegisterDialogOpen(true)}
          onCancel={handleCancelRegistration}
        />
      )}

      <RegistrationDialog
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
        event={event}
        onSubmit={handleRegister}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
