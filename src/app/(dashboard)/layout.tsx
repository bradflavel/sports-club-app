'use client';

import { Suspense } from 'react';
import { Sidebar } from '@/components/layouts/sidebar';
import { TopBar } from '@/components/layouts/top-bar';
import { MobileNav } from '@/components/layouts/mobile-nav';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { AuthProvider, useAuth } from '@/hooks/use-auth-context';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, organisation } = useAuth();

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Suspense>
        <Sidebar
          orgName={organisation?.name}
          orgLogo={organisation?.logo_url}
          userName={profile ? `${profile.first_name} ${profile.last_name}` : ''}
          userAvatar={profile?.avatar_url}
          userFirstName={profile?.first_name}
          userLastName={profile?.last_name}
        />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          orgName={organisation?.name}
          orgLogo={organisation?.logo_url}
          userFirstName={profile?.first_name}
          userLastName={profile?.last_name}
          userAvatar={profile?.avatar_url}
        />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6">
          <Suspense>
            <ErrorBoundary>{children}</ErrorBoundary>
          </Suspense>
        </main>
        <Suspense>
          <MobileNav />
        </Suspense>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
