'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { CsvImportWizard } from '@/features/members/components/csv-import-wizard';

export default function ImportMembersPage() {
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
        <CsvImportWizard />
      </div>
    </div>
  );
}
