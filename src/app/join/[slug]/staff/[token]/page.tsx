'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { getInviteByToken, acceptInvite } from '@/features/staff/services/staff-invite-service';
import { createStaff } from '@/features/staff/services/staff-service';

type PageState = 'loading' | 'not_found' | 'expired' | 'used' | 'unauthenticated' | 'ready' | 'joining' | 'joined' | 'error';

export default function StaffInvitePage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const router = useRouter();

  const [state, setState] = useState<PageState>('loading');
  const [orgName, setOrgName] = useState('');
  const [staffTypeName, setStaffTypeName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const checkInvite = useCallback(async () => {
    const supabase = createClient();

    // Verify invite token
    const { data: invite, error: inviteError } = await getInviteByToken(token);
    if (inviteError || !invite) {
      setState('not_found');
      return;
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      setState('expired');
      return;
    }

    // Check if already used (single-use)
    if (invite.is_single_use && invite.accepted_at) {
      setState('used');
      return;
    }

    // Get org info
    const { data: org } = await supabase
      .from('organisations')
      .select('name, slug')
      .eq('id', invite.organisation_id)
      .single();

    if (!org || org.slug !== slug) {
      setState('not_found');
      return;
    }

    setOrgName(org.name);
    setStaffTypeName(invite.staff_type.name);

    // Check auth state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState('unauthenticated');
      return;
    }

    setState('ready');
  }, [slug, token]);

  useEffect(() => {
    checkInvite();
  }, [checkInvite]);

  const handleJoin = async () => {
    setState('joining');
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState('unauthenticated');
        return;
      }

      // Get invite details
      const { data: invite } = await getInviteByToken(token);
      if (!invite) {
        setState('error');
        setErrorMessage('Invite not found');
        return;
      }

      // Get user's profile to verify it exists. A user may belong to many
      // organisations, so we no longer block when their active org differs
      // from the invite — assign_user_to_organisation upserts the membership
      // and switches the active context to the inviting club.
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setState('error');
        setErrorMessage('Profile not found. Please complete account setup first.');
        return;
      }

      const { error: assignError } = await supabase.rpc('assign_user_to_organisation', {
        p_user_id: user.id,
        p_org_id: invite.organisation_id,
        p_role: 'member',
      });

      if (assignError) {
        setState('error');
        setErrorMessage(assignError.message);
        return;
      }

      // Check for existing member record
      const { data: memberRecord } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', user.id)
        .eq('organisation_id', invite.organisation_id)
        .maybeSingle();

      // Create staff record
      const { error: staffError } = await createStaff({
        profile_id: user.id,
        organisation_id: invite.organisation_id,
        staff_type_id: invite.staff_type_id,
        member_id: memberRecord?.id ?? null,
        status: 'pending',
      });

      if (staffError) {
        if (staffError.message?.includes('duplicate')) {
          setState('error');
          setErrorMessage('You are already registered as this type of staff.');
        } else {
          setState('error');
          setErrorMessage(staffError.message);
        }
        return;
      }

      // Accept invite
      await acceptInvite(token, user.id);

      setState('joined');
    } catch (err) {
      setState('error');
      setErrorMessage('An unexpected error occurred.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {state === 'loading' && 'Loading...'}
            {state === 'not_found' && 'Invite Not Found'}
            {state === 'expired' && 'Invite Expired'}
            {state === 'used' && 'Invite Already Used'}
            {state === 'unauthenticated' && `Join ${orgName || 'Club'} as Staff`}
            {state === 'ready' && `Join ${orgName} as ${staffTypeName}`}
            {state === 'joining' && 'Joining...'}
            {state === 'joined' && 'Welcome!'}
            {state === 'error' && 'Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === 'loading' && <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />}

          {state === 'not_found' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">This invite link is invalid or has been revoked.</p>
            </>
          )}

          {state === 'expired' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-amber-500" />
              <p className="text-muted-foreground">This invite link has expired. Ask the club admin for a new one.</p>
            </>
          )}

          {state === 'used' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-amber-500" />
              <p className="text-muted-foreground">This invite link has already been used.</p>
            </>
          )}

          {state === 'unauthenticated' && (
            <>
              <p className="text-muted-foreground">You need to sign in or create an account to accept this invite.</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push(`/login?staffInvite=${token}&join=${slug}`)}>
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => router.push(`/signup?staffInvite=${token}&join=${slug}`)}>
                  Create Account
                </Button>
              </div>
            </>
          )}

          {state === 'ready' && (
            <>
              <p className="text-muted-foreground">
                You&apos;ve been invited to join <strong>{orgName}</strong> as a <strong>{staffTypeName}</strong>.
              </p>
              <Button onClick={handleJoin} className="w-full">Accept & Join</Button>
            </>
          )}

          {state === 'joining' && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}

          {state === 'joined' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-muted-foreground">
                You&apos;ve joined <strong>{orgName}</strong> as a <strong>{staffTypeName}</strong>. Your status is pending until an admin approves.
              </p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
