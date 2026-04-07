'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, UserPlus, Mail, Phone, Calendar, MapPin, Badge as BadgeIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import { getStaffById } from '@/features/staff/services/staff-service';
import { getFieldValues, getFieldsForStaffType } from '@/features/staff/services/staff-field-service';
import { StaffAccreditationList } from '@/features/staff/components/staff-accreditation-list';
import { WwcCheckField } from '@/features/staff/components/wwc-check-field';
import { SponsorMembershipDialog } from '@/features/staff/components/sponsor-membership-dialog';
import type { StaffWithDetails } from '@/features/staff/types';
import type { StaffTypeField, StaffFieldValue } from '@/lib/supabase/database.types';

const statusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  pending: 'Pending',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  on_leave: 'outline',
  pending: 'secondary',
};

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile: authProfile, organisation } = useAuth();
  const { toast } = useToast();

  const [staffRecord, setStaffRecord] = useState<StaffWithDetails | null>(null);
  const [customFields, setCustomFields] = useState<StaffTypeField[]>([]);
  const [fieldValues, setFieldValues] = useState<StaffFieldValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorOpen, setSponsorOpen] = useState(false);

  const isAdmin = authProfile?.role === 'admin' || authProfile?.role === 'manager';

  const fetchData = useCallback(async () => {
    const { data, error } = await getStaffById(id);
    if (error || !data) {
      toast({ title: 'Error', description: error?.message ?? 'Staff member not found', variant: 'destructive' });
      router.push('/staff');
      return;
    }
    setStaffRecord(data);

    const [fieldsResult, valuesResult] = await Promise.all([
      getFieldsForStaffType(data.staff_type_id),
      getFieldValues(data.id),
    ]);

    setCustomFields(fieldsResult.data ?? []);
    setFieldValues(valuesResult.data ?? []);
    setLoading(false);
  }, [id, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !staffRecord) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const { profile } = staffRecord;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const hasNoMembership = !staffRecord.member_id;

  const getFieldValue = (fieldId: string) =>
    fieldValues.find((fv) => fv.staff_type_field_id === fieldId)?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        badge={
          <Badge variant={statusVariant[staffRecord.status] ?? 'secondary'}>
            {statusLabel[staffRecord.status] ?? staffRecord.status}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/staff')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => router.push(`/staff/${id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg">{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold">{fullName}</h2>
              {staffRecord.position && (
                <p className="text-sm text-muted-foreground">{staffRecord.position}</p>
              )}
              <Badge variant="outline" className="mt-2">{staffRecord.staff_type.name}</Badge>

              {staffRecord.staff_type.is_publicly_visible && (
                <Badge variant="secondary" className="mt-1 text-xs">Publicly Visible</Badge>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {staffRecord.start_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {new Date(staffRecord.start_date).toLocaleDateString('en-AU')}</span>
                </div>
              )}
            </div>

            {isAdmin && hasNoMembership && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">This person is staff-only and does not have a club membership.</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setSponsorOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Membership
                  </Button>
                </div>
              </>
            )}

            {staffRecord.member_id && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BadgeIcon className="h-3 w-3" />
                  <span>Linked to club membership</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Details & Accreditations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Fields */}
          {customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {customFields.map((field) => {
                    const value = getFieldValue(field.id);
                    return (
                      <div key={field.id}>
                        <p className="text-xs text-muted-foreground">{field.name}</p>
                        <p className="text-sm">
                          {field.field_type === 'boolean'
                            ? value === 'true' ? 'Yes' : 'No'
                            : field.field_type === 'url' && value
                              ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline">{value}</a>
                              : value || '\u2014'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {staffRecord.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{staffRecord.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Accreditations */}
          <Card>
            <CardContent className="pt-6">
              <StaffAccreditationList
                staffId={staffRecord.id}
                organisationId={staffRecord.organisation_id}
                isAdmin={isAdmin}
                requiresWwc={staffRecord.staff_type.requires_wwc}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {hasNoMembership && organisation && (
        <SponsorMembershipDialog
          open={sponsorOpen}
          onOpenChange={setSponsorOpen}
          staffId={staffRecord.id}
          profile={profile}
          organisationId={organisation.id}
          onComplete={() => fetchData()}
        />
      )}
    </div>
  );
}
