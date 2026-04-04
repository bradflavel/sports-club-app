'use client';

import { useState } from 'react';
import { Copy, Check, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface InviteLinkGeneratorProps {
  orgSlug: string;
}

export function InviteLinkGenerator({ orgSlug }: InviteLinkGeneratorProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/onboarding?join=${orgSlug}`
      : `/onboarding?join=${orgSlug}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(orgSlug);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Invite code copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy to clipboard.', variant: 'destructive' });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({ title: 'Copied!', description: 'Invite link copied to clipboard.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy to clipboard.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Invite code */}
      <div className="space-y-2">
        <Label>Invite Code</Label>
        <div className="flex items-center gap-2">
          <Input
            value={orgSlug}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this code with members so they can join your club.
        </p>
      </div>

      {/* Full invite link */}
      <div className="space-y-2">
        <Label>Invite Link</Label>
        <div className="flex items-center gap-2">
          <Input
            value={inviteUrl}
            readOnly
            className="text-sm text-muted-foreground"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            <Link className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}
