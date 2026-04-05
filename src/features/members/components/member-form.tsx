'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberSchema } from '@/features/members/schemas/member-schemas';
import type { MemberInput } from '@/features/members/schemas/member-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { calculateAge, isMinor } from '@/lib/format';
import { GuardianSearch } from './guardian-search';
import type { GuardianEntry } from './guardian-search';
import type { GuardianRelationship } from '@/lib/supabase/database.types';

interface MemberFormProps {
  defaultValues?: Partial<MemberInput>;
  onSubmit: (data: MemberInput) => Promise<void>;
  loading?: boolean;
  orgId?: string;
}

export function MemberForm({ defaultValues, onSubmit, loading = false, orgId }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      membershipType: undefined,
      registrationDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      medicalConditions: '',
      dietaryRequirements: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: '',
      guardians: [],
      ...defaultValues,
    },
  });

  const membershipType = watch('membershipType');
  const dateOfBirth = watch('dateOfBirth');
  const guardians = watch('guardians') ?? [];
  const isJunior = membershipType === 'junior';

  // Auto-suggest junior when DOB indicates under 18
  useEffect(() => {
    if (dateOfBirth && membershipType !== 'junior') {
      if (isMinor(dateOfBirth)) {
        setValue('membershipType', 'junior', { shouldValidate: true });
      }
    }
  }, [dateOfBirth, membershipType, setValue]);

  // Show warning when a junior member's DOB indicates they've turned 18
  const showAgeWarning =
    isJunior && dateOfBirth && !isMinor(dateOfBirth);

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

  function handleGuardiansChange(updated: GuardianEntry[]) {
    setValue(
      'guardians',
      updated.map((g) => ({
        memberId: g.memberId,
        relationship: g.relationship as GuardianRelationship,
        consentGiven: g.consentGiven,
      })),
      { shouldValidate: true }
    );
  }

  // Map form guardians to GuardianEntry shape for the search component
  const guardianEntries: GuardianEntry[] = guardians.map((g) => ({
    memberId: g.memberId,
    memberName: '', // filled by the search component when adding
    memberEmail: '',
    relationship: g.relationship as GuardianRelationship,
    consentGiven: g.consentGiven,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Age warning */}
      {showAgeWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              This member is {age} years old
            </p>
            <p className="text-sm text-amber-700">
              Their date of birth indicates they are 18 or older. Consider changing the
              membership type to Senior.
            </p>
          </div>
        </div>
      )}

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Enter first name"
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Enter last name"
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="member@example.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+61 400 000 000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth{' '}
              {isJunior && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
              aria-invalid={!!errors.dateOfBirth}
            />
            {age !== null && (
              <p className="text-xs text-muted-foreground">
                Age: {age} year{age !== 1 ? 's' : ''}
              </p>
            )}
            {errors.dateOfBirth && (
              <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Membership */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membership</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="membershipType">
              Membership Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={membershipType}
              onValueChange={(val) =>
                setValue('membershipType', val as MemberInput['membershipType'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="membershipType" aria-invalid={!!errors.membershipType}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="life">Life</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
              </SelectContent>
            </Select>
            {errors.membershipType && (
              <p className="text-xs text-destructive">{errors.membershipType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDate">
              Registration Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="registrationDate"
              type="date"
              {...register('registrationDate')}
              aria-invalid={!!errors.registrationDate}
            />
            {errors.registrationDate && (
              <p className="text-xs text-destructive">{errors.registrationDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              {...register('expiryDate')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardian section - shown for junior members */}
      {isJunior && orgId && (
        <GuardianSearch
          orgId={orgId}
          guardians={guardianEntries}
          onChange={handleGuardiansChange}
          error={errors.guardians?.message}
        />
      )}

      {/* Medical & Dietary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical &amp; Dietary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicalConditions">Medical Conditions</Label>
            <Textarea
              id="medicalConditions"
              {...register('medicalConditions')}
              placeholder="List any medical conditions or allergies..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
            <Textarea
              id="dietaryRequirements"
              {...register('dietaryRequirements')}
              placeholder="List any dietary requirements..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">
              Contact Name{' '}
              {isJunior && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="emergencyContactName"
              {...register('emergencyContactName')}
              placeholder="Full name"
              aria-invalid={!!errors.emergencyContactName}
            />
            {errors.emergencyContactName && (
              <p className="text-xs text-destructive">
                {errors.emergencyContactName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">
              Contact Phone{' '}
              {isJunior && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              {...register('emergencyContactPhone')}
              placeholder="+61 400 000 000"
              aria-invalid={!!errors.emergencyContactPhone}
            />
            {errors.emergencyContactPhone && (
              <p className="text-xs text-destructive">
                {errors.emergencyContactPhone.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes about this member..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? 'Save Changes' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}
