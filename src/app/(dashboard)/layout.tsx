'use client';

import { Sidebar } from '@/components/layouts/sidebar';
import { TopBar } from '@/components/layouts/top-bar';
import { MobileNav } from '@/components/layouts/mobile-nav';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useUser();
  const { organisation } = useOrganisation();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        orgName={organisation?.name}
        orgLogo={organisation?.logo_url}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : ''}
        userAvatar={profile?.avatar_url}
        userFirstName={profile?.first_name}
        userLastName={profile?.last_name}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          orgName={organisation?.name}
          userFirstName={profile?.first_name}
          userLastName={profile?.last_name}
          userAvatar={profile?.avatar_url}
        />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
