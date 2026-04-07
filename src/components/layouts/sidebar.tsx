'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Calendar,
  DollarSign,
  FileText,
  Camera,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trophy,
  Award,
  Dumbbell,
  Tent,
  ClipboardCheck,
  PartyPopper,
  ShoppingBag,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { useEnabledModules } from '@/hooks/use-enabled-modules';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import type { ActivityType } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Award,
  Dumbbell,
  Tent,
  ClipboardCheck,
};

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const coreNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/club', label: 'Club', icon: Building2 },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/staff', label: 'Staff', icon: UserCog },
];

const legacyActivityNav: NavItem[] = [
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/fixtures', label: 'Fixtures', icon: Calendar },
];

const toolsNav: NavItem[] = [
  { href: '/events', label: 'Events', icon: PartyPopper },
  { href: '/payments', label: 'Payments', icon: DollarSign },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/photos', label: 'Photos', icon: Camera },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
];

interface SidebarProps {
  orgName?: string;
  orgLogo?: string | null;
  userName?: string;
  userAvatar?: string | null;
  userFirstName?: string;
  userLastName?: string;
}

export function Sidebar({
  orgName = 'ClubConnect',
  orgLogo,
  userName,
  userAvatar,
  userFirstName = '',
  userLastName = '',
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { enabledModules } = useEnabledModules();

  const moduleNavItems: NavItem[] = enabledModules.map((mod) => {
    const config = ACTIVITY_TYPE_CONFIG[mod.activity_type as ActivityType];
    return {
      href: config.navHref,
      label: config.label,
      icon: MODULE_ICON_MAP[config.icon] ?? Calendar,
    };
  });

  const activityNav = moduleNavItems.length > 0 ? moduleNavItems : legacyActivityNav;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  function isItemActive(href: string) {
    const hrefPath = href.split('?')[0];
    const hrefParams = new URLSearchParams(href.split('?')[1] || '');
    return (
      pathname.startsWith(hrefPath) &&
      (!hrefParams.has('type') || searchParams.get('type') === hrefParams.get('type'))
    );
  }

  function renderNavItem(item: NavItem) {
    const active = isItemActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
          collapsed ? 'justify-center px-2' : '',
          active
            ? 'bg-primary/10 text-primary font-semibold shadow-sm'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
        title={collapsed ? item.label : undefined}
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all duration-200',
            active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-sidebar-accent/60 text-sidebar-foreground/60 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground'
          )}
        >
          <item.icon className="h-[18px] w-[18px]" />
        </div>
        <span className={cn(
          'truncate text-[13.5px] transition-all duration-300',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}>{item.label}</span>
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        'hidden h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out lg:flex overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Org header */}
      <div
        className={cn(
          'flex h-[68px] items-center border-b px-3',
          collapsed ? 'justify-center cursor-pointer hover:bg-sidebar-accent/50 transition-colors' : 'justify-between'
        )}
        onClick={collapsed ? () => setCollapsed(false) : undefined}
        title={collapsed ? 'Expand sidebar' : undefined}
      >
        <div className={cn('flex items-center min-w-0', collapsed ? 'justify-center' : 'gap-2.5')}>
          {orgLogo ? (
            <Image
              src={orgLogo}
              alt={orgName}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              {orgName.charAt(0)}
            </div>
          )}
          <div className={cn('min-w-0 transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
            <p className="truncate text-sm font-semibold leading-tight">{orgName}</p>
            <p className="truncate text-[11px] text-muted-foreground">Sports Club</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-all duration-300', collapsed ? 'w-0 opacity-0 p-0' : 'opacity-100')}
          onClick={() => setCollapsed(true)}
          tabIndex={collapsed ? -1 : 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {/* Core */}
        <div className="space-y-0.5">
          <p className={cn('mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 transition-all duration-300 truncate', collapsed ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100')}>
            Main
          </p>
          {coreNav.map(renderNavItem)}
        </div>

        <Separator className="my-3 opacity-50" />

        {/* Activities */}
        <div className="space-y-0.5">
          <p className={cn('mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 transition-all duration-300 truncate', collapsed ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100')}>
            Activities
          </p>
          {activityNav.map(renderNavItem)}
        </div>

        <Separator className="my-3 opacity-50" />

        {/* Tools */}
        <div className="space-y-0.5">
          <p className={cn('mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 transition-all duration-300 truncate', collapsed ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100')}>
            Tools
          </p>
          {toolsNav.map(renderNavItem)}
        </div>

        <Separator className="my-3 opacity-50" />

        {/* Settings */}
        <div className="space-y-0.5">
          {renderNavItem({ href: '/settings', label: 'Settings', icon: Settings })}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-sidebar-accent active:scale-[0.98]',
                collapsed && 'justify-center px-2'
              )}
            >
              <Avatar className="h-9 w-9 shadow-sm">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(userFirstName, userLastName)}
                </AvatarFallback>
              </Avatar>
              <div className={cn('min-w-0 text-left flex-1 transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
                <p className="truncate text-sm font-medium leading-tight">{userName}</p>
              </div>
              <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'opacity-100')} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="gap-2">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
