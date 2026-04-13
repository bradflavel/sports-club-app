'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth-context';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed = false }: OrgSwitcherProps) {
  const { organisation, memberships, switchOrganisation } = useAuth();
  const { toast } = useToast();
  const [switching, setSwitching] = useState<string | null>(null);

  const activeOrgName = organisation?.name ?? 'ClubConnect';
  const activeOrgLogo = organisation?.logo_url ?? null;
  const hasMultiple = memberships.length > 1;

  async function handleSwitch(orgId: string) {
    if (orgId === organisation?.id) return;
    setSwitching(orgId);
    try {
      await switchOrganisation(orgId);
      // Hard reload so server-rendered pages and cached data refresh against
      // the new active org context.
      window.location.assign('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not switch organisation.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setSwitching(null);
    }
  }

  const trigger = (
    <button
      className={cn(
        'flex w-full items-center min-w-0 rounded-md transition-colors',
        collapsed ? 'justify-center' : 'gap-2.5 text-left hover:bg-sidebar-accent/50 px-1 py-1 -mx-1'
      )}
      title={collapsed ? activeOrgName : undefined}
    >
      {activeOrgLogo ? (
        <Image
          src={activeOrgLogo}
          alt={activeOrgName}
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          {activeOrgName.charAt(0)}
        </div>
      )}
      <div
        className={cn(
          'min-w-0 flex-1 transition-all duration-300',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}
      >
        <p className="truncate text-sm font-semibold leading-tight">{activeOrgName}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {hasMultiple ? `${memberships.length} clubs` : 'Sports Club'}
        </p>
      </div>
      {!collapsed && (
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      )}
    </button>
  );

  // When there are no memberships yet (e.g. brand-new user mid-onboarding),
  // render the static block so the dropdown isn't empty/confusing.
  if (memberships.length === 0) {
    return trigger;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Your Clubs
        </DropdownMenuLabel>
        {memberships.map((m) => {
          const isActive = m.id === organisation?.id;
          const isSwitching = switching === m.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onClick={() => handleSwitch(m.id)}
              disabled={isSwitching}
              className="gap-2.5"
            >
              {m.logo_url ? (
                <Image
                  src={m.logo_url}
                  alt={m.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded object-cover"
                />
              ) : (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                  style={{ backgroundColor: m.primary_colour ?? '#000000' }}
                >
                  {m.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{m.name}</p>
                <p className="truncate text-[11px] capitalize text-muted-foreground">{m.role}</p>
              </div>
              {isSwitching ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : isActive ? (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="gap-2">
            <Plus className="h-4 w-4" />
            Create or join another club
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
