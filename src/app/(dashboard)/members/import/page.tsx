'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { CsvImportWizard } from '@/features/members/components/csv-import-wizard';
import { useOrganisation } from '@/hooks/use-organisation';

export default function ImportMembersPage() {
  const { organisation, loading } = useOrganisation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No organisation found. Please set up your organisation first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Members"
        description="Bulk import members from a CSV file."
        actions={
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/members">
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl">
        <CsvImportWizard orgId={organisation.id} />
      </div>
    </div>
  );
}
