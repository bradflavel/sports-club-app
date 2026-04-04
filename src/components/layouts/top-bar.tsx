'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface TopBarProps {
  orgName?: string;
  userFirstName?: string;
  userLastName?: string;
  userAvatar?: string | null;
  onMenuClick?: () => void;
}

export function TopBar({
  orgName = 'ClubConnect',
  userFirstName = '',
  userLastName = '',
  userAvatar,
  onMenuClick,
}: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{orgName}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={userAvatar || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(userFirstName, userLastName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
