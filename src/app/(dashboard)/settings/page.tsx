'use client';

import { useState, useEffect } from 'react';
import { Loader2, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ModuleSettings } from '@/features/activities/components/module-settings';
import { useEnabledModules } from '@/hooks/use-enabled-modules';

export default function SettingsPage() {
  const { profile } = useUser();
  const { organisation } = useOrganisation();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';
  const { modules, refetch: refetchModules } = useEnabledModules();

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

      <Tabs defaultValue={isAdmin ? 'general' : 'profile'}>
        <TabsList>
          {isAdmin && <TabsTrigger value="general">General</TabsTrigger>}
          {isAdmin && <TabsTrigger value="modules">Activity Types</TabsTrigger>}
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="general" className="space-y-6">
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

        {isAdmin && organisation && (
          <TabsContent value="modules" className="space-y-4">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold mb-1">Activity Modules</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable or disable activity types for your club. Enabled modules appear in the sidebar navigation.
              </p>
              <ModuleSettings
                orgId={organisation.id}
                modules={modules}
                onModuleChange={refetchModules}
              />
            </div>
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
