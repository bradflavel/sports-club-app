'use client';

import { useState, useEffect } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { profile } = useUser();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  // Edit mode per section
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingContact, setEditingContact] = useState(false);

  // Editable fields
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Password reset
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (profile) {
      resetPersonalFields();
      resetContactFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const resetPersonalFields = () => {
    setPreferredName(profile?.preferred_name || '');
  };

  const resetContactFields = () => {
    setPhone(profile?.phone ? formatPhoneDisplay(normalisePhone(profile.phone)) : '');
    setEmergencyName(profile?.emergency_contact_name || '');
    setEmergencyPhone(profile?.emergency_contact_phone ? formatPhoneDisplay(normalisePhone(profile.emergency_contact_phone)) : '');
  };

  const handleSavePersonal = async () => {
    if (!profile) return;
    setPersonalLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_name: preferredName || null })
      .eq('id', profile.id);
    setPersonalLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Personal details saved' });
      setEditingPersonal(false);
    }
  };

  const handleSaveContact = async () => {
    if (!profile) return;

    const phoneDigits = phone.replace(/\D/g, '');
    const emergencyDigits = emergencyPhone.replace(/\D/g, '');

    if (phoneDigits && (phoneDigits.length !== 10 || !phoneDigits.startsWith('04'))) {
      toast({ title: 'Phone must be a valid Australian mobile (04XX XXX XXX)', variant: 'destructive' });
      return;
    }
    if (emergencyDigits && (emergencyDigits.length !== 10 || !emergencyDigits.startsWith('04'))) {
      toast({ title: 'Emergency phone must be a valid Australian mobile (04XX XXX XXX)', variant: 'destructive' });
      return;
    }

    setContactLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: phoneDigits || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyDigits || null,
      })
      .eq('id', profile.id);
    setContactLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Contact details saved' });
      setEditingContact(false);
    }
  };

  const handleCancelPersonal = () => {
    resetPersonalFields();
    setEditingPersonal(false);
  };

  const handleCancelContact = () => {
    resetContactFields();
    setEditingContact(false);
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPasswordLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setResetSent(true);
      toast({ title: 'Password reset email sent', description: 'Check your inbox for a reset link.' });
    }
  };

  const formatGender = (g: string | null | undefined) => {
    if (!g) return '—';
    return g.charAt(0).toUpperCase() + g.slice(1);
  };

  const formatDob = (dob: string | null | undefined) => {
    if (!dob) return '—';
    const [y, m, d] = dob.split('-');
    return `${d}/${m}/${y}`;
  };

  /** Strip non-digits, enforce 04 prefix, cap at 10 digits. */
  const normalisePhone = (raw: string): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('614')) digits = '0' + digits.slice(2);
    else if (digits.startsWith('4') && digits.length <= 9) digits = '0' + digits;
    if (digits.length > 0 && !digits.startsWith('04')) digits = '04' + digits.replace(/^0+/, '');
    return digits.slice(0, 10);
  };

  /** Format 0412345678 → 0412 345 678 */
  const formatPhoneDisplay = (digits: string): string => {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  };

  const handlePhoneChange = (value: string, setter: (v: string) => void) => {
    setter(formatPhoneDisplay(normalisePhone(value)));
  };

  return (
    <div className="space-y-6 px-32">
      <PageHeader title="Settings" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            {/* Personal details */}
            <div className="space-y-4 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  {!isAdmin && (
                    <p className="text-sm text-muted-foreground">
                      Contact an administrator to update these details.
                    </p>
                  )}
                </div>
                {!editingPersonal && (
                  <Button variant="ghost" size="icon" onClick={() => setEditingPersonal(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">First Name</Label>
                  <p className="text-sm font-medium">{profile?.first_name || '—'}</p>
                </div>
                <div className="space-y-2">
                  {editingPersonal ? (
                    <>
                      <Label>Preferred Name</Label>
                      <Input
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        placeholder="Optional"
                      />
                    </>
                  ) : (
                    <>
                      <Label className="text-muted-foreground">Preferred Name</Label>
                      <p className="text-sm font-medium">{profile?.preferred_name || '—'}</p>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Last Name</Label>
                  <p className="text-sm font-medium">{profile?.last_name || '—'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="text-sm font-medium">{formatDob(profile?.date_of_birth)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="text-sm font-medium">{formatGender(profile?.gender)}</p>
                </div>
              </div>
              {editingPersonal && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSavePersonal} disabled={personalLoading}>
                    {personalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancelPersonal} disabled={personalLoading}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Contact details */}
            <div className="space-y-4 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                {!editingContact && (
                  <Button variant="ghost" size="icon" onClick={() => setEditingContact(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {editingContact ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{profile?.email || '—'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      placeholder="04XX XXX XXX"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value, setPhone)}
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground pt-2">Emergency Contact</h4>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      placeholder="04XX XXX XXX"
                      value={emergencyPhone}
                      onChange={(e) => handlePhoneChange(e.target.value, setEmergencyPhone)}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveContact} disabled={contactLoading}>
                      {contactLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancelContact} disabled={contactLoading}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{profile?.email || '—'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-sm font-medium">
                      {profile?.phone ? formatPhoneDisplay(normalisePhone(profile.phone)) : '—'}
                    </p>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground pt-2">Emergency Contact</h4>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">{profile?.emergency_contact_name || '—'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-sm font-medium">
                      {profile?.emergency_contact_phone ? formatPhoneDisplay(normalisePhone(profile.emergency_contact_phone)) : '—'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <div className="max-w-md space-y-4 rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a password reset link to <span className="font-medium text-foreground">{profile?.email}</span>.
            </p>
            {resetSent ? (
              <p className="text-sm text-muted-foreground">
                Reset link sent. Check your inbox.
              </p>
            ) : (
              <Button onClick={handleResetPassword} disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
