'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MoreVertical,
  UserX,
  Trash2,
  Shield,
  UserCheck,
  PauseCircle,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberProfileCard } from '@/features/members/components/member-profile-card';
import { MemberStats } from '@/features/members/components/member-stats';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatCurrency, formatDateTime, calculateAge, isMinor } from '@/lib/format';
import { processAgeOut } from '@/features/members/services/age-transition-service';
import {
  getGuardiansForMember,
  getDependentsForMember,
} from '@/features/members/services/guardian-service';
import type { MemberWithProfile, MemberGuardian } from '@/features/members/types/member-types';
import type {
  ActivityTeamMember,
  ActivityTeam,
  ActivityEventWithTeams,
  Payment,
  MembershipStatus,
} from '@/lib/supabase/database.types';

interface ActivityTeamMemberRow extends ActivityTeamMember {
  team: ActivityTeam & { activity?: { name: string } | null };
}

interface PaymentRow extends Payment {}


export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [member, setMember] = useState<MemberWithProfile | null>(null);
  const [teamMemberships, setTeamMemberships] = useState<ActivityTeamMemberRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<
    (MemberGuardian & { guardian: MemberWithProfile })[]
  >([]);
  const [dependentLinks, setDependentLinks] = useState<
    (MemberGuardian & { minor: MemberWithProfile })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [memberResult, teamResult, paymentResult] = await Promise.all([
      supabase.from('members').select('*, profile:profiles(*)').eq('id', id).single(),
      supabase
        .from('activity_team_members')
        .select('*, team:activity_teams(*, activity:activities(name))')
        .eq('member_id', id)
        .order('joined_at', { ascending: false }),
      supabase
        .from('payments')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (memberResult.data) {
      const m = memberResult.data as unknown as MemberWithProfile;
      setMember(m);

      if (teamResult.data && teamResult.data.length > 0) {
        setTeamMemberships(teamResult.data as unknown as ActivityTeamMemberRow[]);

        const activityTeamIds = teamResult.data.map((tm) => tm.activity_team_id);
        const { data: eventData } = await supabase
          .from('activity_events')
          .select('*, home_team:activity_teams!activity_events_home_team_id_fkey(*), away_team:activity_teams!activity_events_away_team_id_fkey(*), activity:activities(*)')
          .or(activityTeamIds.map((id) => `home_team_id.eq.${id}`).join(',') + ',' + activityTeamIds.map((id) => `away_team_id.eq.${id}`).join(','))
          .order('date_time', { ascending: false })
          .limit(20);

        if (eventData) setEvents(eventData as unknown as ActivityEventWithTeams[]);
      }
    }

    if (paymentResult.data) {
      setPayments(paymentResult.data as PaymentRow[]);
    }

    // Fetch guardian relationships
    if (memberResult.data) {
      const m = memberResult.data as unknown as MemberWithProfile;

      // Fetch guardians for any member (not just juniors)
      const { data: guardians } = await getGuardiansForMember(id);
      if (guardians) setGuardianLinks(guardians);

      // Check if this member is a guardian of others
      const { data: dependents } = await getDependentsForMember(id);
      if (dependents && dependents.length > 0) setDependentLinks(dependents);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(status: MembershipStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from('members')
      .update({ membership_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member status updated' });
      fetchData();
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error removing member', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
      router.push('/members');
    }
  }

  if (loading) return <PageSkeleton />;

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold">Member not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/members">Back to Members</Link>
        </Button>
      </div>
    );
  }

  const { profile } = member;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${profile.first_name} ${profile.last_name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/members">
                <ArrowLeft className="h-4 w-4" />
                Members
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/members/${id}/edit`}>Edit</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {member.membership_status !== 'active' && (
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleStatusChange('active')}
                  >
                    <UserCheck className="h-4 w-4" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {member.membership_status !== 'suspended' && (
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleStatusChange('suspended')}
                  >
                    <PauseCircle className="h-4 w-4" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {member.membership_status !== 'inactive' && (
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => handleStatusChange('inactive')}
                  >
                    <Shield className="h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <MemberProfileCard
        member={member}
        showEdit
        guardians={guardianLinks.map((g) => ({
          name: `${g.guardian.profile.first_name} ${g.guardian.profile.last_name}`,
          relationship: g.relationship,
        }))}
      />
      {/* Age-out transition banner */}
      {member.profile.date_of_birth &&
        !isMinor(member.profile.date_of_birth) &&
        guardianLinks.length > 0 && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  This member is {calculateAge(member.profile.date_of_birth)} and has turned 18 but still has guardian links
                </p>
                <p className="mt-0.5 text-sm text-amber-700">
                  Processing will copy guardian contact details to emergency contacts and remove
                  guardian links.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
              onClick={async () => {
                const { error } = await processAgeOut(id);
                if (error) {
                  toast({
                    title: 'Error',
                    description: String(error),
                    variant: 'destructive',
                  });
                } else {
                  toast({ title: 'Age-out processed — guardians removed' });
                  fetchData();
                }
              }}
            >
              Process Age-Out
            </Button>
          </div>
        )}

      <MemberStats memberId={id} />

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">
            Teams
            {teamMemberships.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 rounded-full px-1.5 text-xs">
                {teamMemberships.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {payments.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 rounded-full px-1.5 text-xs">
                {payments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matches">Event History</TabsTrigger>
          {guardianLinks.length > 0 && (
            <TabsTrigger value="guardians">
              Guardians
              <Badge variant="secondary" className="ml-1.5 h-5 rounded-full px-1.5 text-xs">
                {guardianLinks.length}
              </Badge>
            </TabsTrigger>
          )}
          {dependentLinks.length > 0 && (
            <TabsTrigger value="dependents">
              Dependents
              <Badge variant="secondary" className="ml-1.5 h-5 rounded-full px-1.5 text-xs">
                {dependentLinks.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="First Name" value={profile.first_name} />
                <DetailRow label="Last Name" value={profile.last_name} />
                <DetailRow label="Email" value={profile.email} />
                <DetailRow label="Phone" value={profile.phone ?? '—'} />
                <DetailRow
                  label="Date of Birth"
                  value={profile.date_of_birth ? formatDate(profile.date_of_birth) : '—'}
                />
                <DetailRow label="Role" value={profile.role} capitalize />
              </CardContent>
            </Card>

            {/* Membership Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Type" value={member.membership_type} capitalize />
                <DetailRow label="Status">
                  <StatusBadge status={member.membership_status} />
                </DetailRow>
                <DetailRow
                  label="Registration Date"
                  value={formatDate(member.registration_date)}
                />
                <DetailRow
                  label="Expiry Date"
                  value={member.expiry_date ? formatDate(member.expiry_date) : '—'}
                />
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Name" value={profile.emergency_contact_name ?? '—'} />
                  <DetailRow label="Phone" value={profile.emergency_contact_phone ?? '—'} />
                </CardContent>
              </Card>
            )}

            {/* Medical & Dietary */}
            {(member.medical_conditions || member.dietary_requirements || member.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Medical &amp; Dietary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {member.medical_conditions && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Medical Conditions
                      </p>
                      <p className="mt-1 text-sm">{member.medical_conditions}</p>
                    </div>
                  )}
                  {member.dietary_requirements && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Dietary Requirements
                      </p>
                      <p className="mt-1 text-sm">{member.dietary_requirements}</p>
                    </div>
                  )}
                  {member.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Notes</p>
                      <p className="mt-1 text-sm">{member.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-4">
          {teamMemberships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <UserX className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Not in any teams</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This member has not been added to any teams yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamMemberships.map((tm) => (
                <Card key={tm.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate block">
                          {tm.team.name}
                        </p>
                        {tm.team.division && (
                          <p className="text-xs text-muted-foreground">{tm.team.division}</p>
                        )}
                        {tm.team.activity?.name && (
                          <p className="text-xs text-muted-foreground">{tm.team.activity.name}</p>
                        )}
                      </div>
                      {tm.is_captain && (
                        <Badge variant="default" className="shrink-0 text-xs">
                          Captain
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {tm.position && (
                        <span>
                          <span className="font-medium">Position:</span> {tm.position}
                        </span>
                      )}
                      {tm.jersey_number != null && (
                        <span>
                          <span className="font-medium">Jersey:</span> #{tm.jersey_number}
                        </span>
                      )}
                      <span>
                        <span className="font-medium">Joined:</span> {formatDate(tm.joined_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <p className="font-medium">No payment records</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No payment history found for this member.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="px-4 py-3">{payment.description}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(payment.amount_cents)}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {payment.payment_type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(payment.due_date)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {payment.paid_date ? formatDate(payment.paid_date) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Guardians Tab */}
        {guardianLinks.length > 0 && (
          <TabsContent value="guardians" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guardianLinks.map((link) => (
                <Card key={link.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/members/${link.guardian.id}`}
                          className="font-medium hover:underline truncate block"
                        >
                          {link.guardian.profile.first_name} {link.guardian.profile.last_name}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">
                          {link.relationship.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {link.is_primary && (
                        <Badge variant="default" className="shrink-0 text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                      <span>{link.guardian.profile.email}</span>
                      {link.guardian.profile.phone && <span>{link.guardian.profile.phone}</span>}
                      <span>
                        Consent:{' '}
                        {link.parental_consent_given ? (
                          <span className="text-emerald-600">Given</span>
                        ) : (
                          <span className="text-destructive">Not given</span>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Dependents Tab (for guardians) */}
        {dependentLinks.length > 0 && (
          <TabsContent value="dependents" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dependentLinks.map((link) => {
                const minorAge = link.minor.profile.date_of_birth
                  ? calculateAge(link.minor.profile.date_of_birth)
                  : null;
                return (
                  <Card key={link.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/members/${link.minor.id}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {link.minor.profile.first_name} {link.minor.profile.last_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {minorAge !== null ? `${minorAge} yrs` : 'Age unknown'} · {link.relationship.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 shrink-0 text-xs">
                          Minor
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium">Status:</span>{' '}
                          <StatusBadge status={link.minor.membership_status} />
                        </span>
                        <span>
                          Consent:{' '}
                          {link.parental_consent_given ? (
                            <span className="text-emerald-600">Given</span>
                          ) : (
                            <span className="text-destructive">Not given</span>
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* Event History Tab */}
        <TabsContent value="matches" className="mt-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <p className="font-medium">No event history</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No events found for this member&apos;s teams.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Home
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Away
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Venue
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(event.date_time)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {event.home_team?.name ?? event.opponent_name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {event.away_team?.name ?? event.opponent_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {event.venue ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {event.home_score != null && event.away_score != null ? (
                            <span>
                              {event.home_score}
                              {' – '}
                              {event.away_score}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={event.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({
  label,
  value,
  capitalize,
  children,
}: {
  label: string;
  value?: string;
  capitalize?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-xs font-medium text-muted-foreground shrink-0 w-36">{label}</span>
      <span className={`text-sm text-right ${capitalize ? 'capitalize' : ''}`}>
        {children ?? value}
      </span>
    </div>
  );
}
