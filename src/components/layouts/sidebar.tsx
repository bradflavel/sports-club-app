'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
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
} from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/fixtures', label: 'Fixtures', icon: Calendar },
  { href: '/payments', label: 'Payments', icon: DollarSign },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/photos', label: 'Photos', icon: Camera },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/settings', label: 'Settings', icon: Settings },
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
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'hidden h-screen flex-col border-r bg-sidebar transition-all duration-300 lg:flex',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {orgLogo ? (
              <Image src={orgLogo} alt={orgName} width={32} height={32} className="h-8 w-8 rounded object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                {orgName.charAt(0)}
              </div>
            )}
            <span className="font-semibold truncate">{orgName}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/50',
                collapsed && 'justify-center'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(userFirstName, userLastName)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <span className="truncate font-medium">{userName}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
