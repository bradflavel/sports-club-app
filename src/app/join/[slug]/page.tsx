'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { SPORT_CONFIGS } from '@/lib/constants';
import type { Organisation } from '@/lib/supabase/database.types';

type JoinState = 'loading' | 'not_found' | 'unauthenticated' | 'already_member' | 'other_org' | 'ready' | 'joining' | 'joined';

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [state, setState] = useState<JoinState>('loading');
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();

    // Fetch org by slug
    const { data: org } = await supabase
      .from('organisations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!org) {
      setState('not_found');
      return;
    }
    setOrganisation(org as unknown as Organisation);

    // Check auth state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState('unauthenticated');
      return;
    }

    // Check if user already has an org
    const { data: profile } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', user.id)
      .single();

    if (profile?.organisation_id === org.id) {
      setState('already_member');
      return;
    }

    if (profile?.organisation_id) {
      setState('other_org');
      return;
    }

    setState('ready');
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin() {
    if (!organisation) return;
    setState('joining');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState('unauthenticated');
      return;
    }

    // Update profile with org
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organisation_id: organisation.id,
        role: 'member',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      setError(profileError.message);
      setState('ready');
      return;
    }

    // Create member record
    await supabase.from('members').insert({
      profile_id: user.id,
      organisation_id: organisation.id,
      membership_type: 'senior',
      membership_status: 'pending',
      registration_date: new Date().toISOString().split('T')[0],
      expiry_date: null,
      medical_conditions: null,
      dietary_requirements: null,
      notes: null,
    });

    setState('joined');
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  const sportLabel = organisation
    ? (SPORT_CONFIGS[organisation.sport_type]?.label ?? organisation.sport_type)
    : '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          )}

          {state === 'not_found' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Club Not Found</h2>
              <p className="text-sm text-muted-foreground">
                This invite link doesn&apos;t match any club. Check the link and try again.
              </p>
              <Button asChild variant="outline">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          )}

          {organisation && (
            <div className="space-y-6">
              {/* Club info */}
              <div className="space-y-3">
                {organisation.logo_url ? (
                  <img
                    src={organisation.logo_url}
                    alt={organisation.name}
                    className="mx-auto h-16 w-auto max-w-16 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold text-white"
                    style={{ backgroundColor: organisation.primary_colour }}
                  >
                    {organisation.name.charAt(0)}
                  </div>
                )}
                <h2 className="text-xl font-semibold">{organisation.name}</h2>
                <Badge variant="secondary">{sportLabel}</Badge>
              </div>

              {/* State-specific content */}
              {state === 'unauthenticated' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Create an account or sign in to join this club.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button asChild>
                      <Link href={`/signup?join=${slug}`}>
                        Sign Up to Join <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/login?join=${slug}`}>
                        Already have an account? Sign In
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {state === 'already_member' && (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-700 font-medium">
                    You&apos;re already a member of this club.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              )}

              {state === 'other_org' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You&apos;re currently a member of another club. You&apos;ll need to leave your
                    current club before joining a new one.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              )}

              {state === 'ready' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve been invited to join this club.
                  </p>
                  <Button onClick={handleJoin} className="w-full">
                    Join {organisation.name}
                  </Button>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
              )}

              {state === 'joining' && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm text-muted-foreground">Joining...</p>
                </div>
              )}

              {state === 'joined' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-emerald-700">
                    Welcome! You&apos;ve joined {organisation.name}.
                  </p>
                  <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
