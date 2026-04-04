'use client';

import { useState, useEffect } from 'react';
import { Loader2, Copy, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { SPORT_TYPE_OPTIONS } from '@/lib/constants';

export default function SettingsPage() {
  const { profile } = useUser();
  const { organisation } = useOrganisation();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';

  // Org settings state
  const [orgName, setOrgName] = useState('');
  const [sportType, setSportType] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [primaryColour, setPrimaryColour] = useState('#1e40af');
  const [secondaryColour, setSecondaryColour] = useState('#ffffff');
  const [orgLoading, setOrgLoading] = useState(false);

  // Profile settings state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);

  useEffect(() => {
    if (organisation) {
      setOrgName(organisation.name);
      setSportType(organisation.sport_type);
      setContactEmail(organisation.contact_email || '');
      setContactPhone(organisation.contact_phone || '');
      setAddress(organisation.address || '');
      setWebsite(organisation.website || '');
      setPrimaryColour(organisation.primary_colour);
      setSecondaryColour(organisation.secondary_colour);
    }
  }, [organisation]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setEmail(profile.email);
      setPhone(profile.phone || '');
      setDob(profile.date_of_birth || '');
      setEmergencyName(profile.emergency_contact_name || '');
      setEmergencyPhone(profile.emergency_contact_phone || '');
    }
  }, [profile]);

  const handleSaveOrg = async () => {
    if (!organisation) return;
    setOrgLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('organisations')
      .update({
        name: orgName,
        sport_type: sportType as never,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        address: address || null,
        website: website || null,
        primary_colour: primaryColour,
        secondary_colour: secondaryColour,
      })
      .eq('id', organisation.id);
    setOrgLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Organisation settings saved' });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        date_of_birth: dob || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
      })
      .eq('id', profile.id);
    setProfileLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile saved' });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const copyInviteCode = () => {
    if (organisation?.slug) {
      navigator.clipboard.writeText(organisation.slug);
      toast({ title: 'Invite code copied!' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Tabs defaultValue={isAdmin ? 'organisation' : 'profile'}>
        <TabsList>
          {isAdmin && <TabsTrigger value="organisation">Organisation</TabsTrigger>}
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="organisation" className="space-y-6">
            <div className="max-w-2xl space-y-4 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">Club Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Club Name</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sport Type</Label>
                  <Select value={sportType} onValueChange={setSportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Colour</Label>
                  <Input value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Colour</Label>
                  <Input value={secondaryColour} onChange={(e) => setSecondaryColour(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveOrg} disabled={orgLoading}>
                {orgLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>

            <div className="max-w-2xl space-y-4 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">Invite Code</h3>
              <p className="text-sm text-muted-foreground">
                Share this code with members so they can join your club.
              </p>
              <div className="flex items-center gap-2">
                <Input value={organisation?.slug || ''} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-w-2xl rounded-lg border border-destructive/50 p-6">
              <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently delete this organisation and all its data.
              </p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => setDeleteOrgOpen(true)}
              >
                Delete Organisation
              </Button>
            </div>

            <ConfirmDialog
              open={deleteOrgOpen}
              onOpenChange={setDeleteOrgOpen}
              title="Delete Organisation"
              description="This will permanently delete all data including members, teams, fixtures, payments, and documents. This cannot be undone."
              variant="destructive"
              confirmLabel="Delete Everything"
              onConfirm={async () => {
                if (!organisation) return;
                const supabase = createClient();
                await supabase.from('organisations').delete().eq('id', organisation.id);
                window.location.href = '/';
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="profile" className="space-y-4">
          <div className="max-w-2xl space-y-4 rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Profile Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
            <h4 className="text-sm font-semibold text-muted-foreground pt-2">Emergency Contact</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <div className="max-w-md space-y-4 rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
