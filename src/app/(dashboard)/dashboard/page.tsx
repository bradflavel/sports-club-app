'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { AdminDashboard } from '@/features/dashboard/components/admin-dashboard';
import { MemberDashboard } from '@/features/dashboard/components/member-dashboard';

export default function DashboardPage() {
  const { profile, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login');
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Redirect to onboarding if not yet in an organisation
  if (!profile.organisation_id) {
    router.push('/onboarding');
    return null;
  }

  if (profile.role === 'admin' || profile.role === 'manager') {
    return <AdminDashboard orgId={profile.organisation_id} />;
  }

  return <MemberDashboard profile={profile} />;
}
