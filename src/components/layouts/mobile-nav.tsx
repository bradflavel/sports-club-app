'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Shield,
  FileText,
  Camera,
  Megaphone,
  Settings,
  Trophy,
  Award,
  Dumbbell,
  Tent,
  PartyPopper,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useEnabledModules } from '@/hooks/use-enabled-modules';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import type { ActivityType } from '@/lib/supabase/database.types';

const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Award,
  Dumbbell,
  Tent,
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { enabledModules } = useEnabledModules();

  // Build dynamic module nav items
  const moduleNavItems = enabledModules.map((mod) => {
    const config = ACTIVITY_TYPE_CONFIG[mod.activity_type as ActivityType];
    return {
      href: config.navHref,
      label: config.label,
      icon: MODULE_ICON_MAP[config.icon] ?? Calendar,
    };
  });

  // Legacy items shown when no modules enabled
  const legacyMainItems = [
    { href: '/fixtures', label: 'Fixtures', icon: Calendar },
  ];
  const legacyMoreItems = [
    { href: '/teams', label: 'Teams', icon: Shield },
  ];

  // First module goes in main bar, rest in "more"
  const firstModule = moduleNavItems[0];
  const restModules = moduleNavItems.slice(1);

  const mainItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/members', label: 'Members', icon: Users },
    ...(firstModule ? [firstModule] : legacyMainItems),
    { href: '/payments', label: 'Payments', icon: DollarSign },
  ];

  const moreItems = [
    { href: '/club', label: 'Club', icon: Building2 },
    { href: '/staff', label: 'Staff', icon: UserCog },
    ...restModules,
    ...(moduleNavItems.length === 0 ? legacyMoreItems : []),
    { href: '/events', label: 'Events', icon: PartyPopper },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/photos', label: 'Photos', icon: Camera },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around py-2">
        {mainItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-sm transition-colors hover:bg-accent"
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
