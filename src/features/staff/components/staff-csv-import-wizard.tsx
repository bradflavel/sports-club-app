'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { parseStaffCsv, type CsvParseResult } from '../services/staff-csv-parser';
import { createStaff } from '../services/staff-service';
import { createClient } from '@/lib/supabase/client';
import type { StaffType } from '@/lib/supabase/database.types';

interface StaffCsvImportWizardProps {
  organisationId: string;
  staffTypes: StaffType[];
}

type Step = 'upload' | 'preview' | 'importing' | 'complete';

export function StaffCsvImportWizard({ organisationId, staffTypes }: StaffCsvImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [defaultTypeId, setDefaultTypeId] = useState(staffTypes[0]?.id ?? '');
  const [importProgress, setImportProgress] = useState({ success: 0, failed: 0, total: 0 });
  const { toast } = useToast();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseStaffCsv(text);
      setParseResult(result);

      if (result.errors.length > 0 && result.rows.length === 0) {
        toast({ title: 'CSV has errors', description: 'Please fix the errors and try again.', variant: 'destructive' });
      } else {
        setStep('preview');
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const handleImport = async () => {
    if (!parseResult) return;

    setStep('importing');
    const total = parseResult.rows.length;
    let success = 0;
    let failed = 0;

    const supabase = createClient();

    // Build a map of staff type names to IDs
    const typeMap = new Map(staffTypes.map((t) => [t.name.toLowerCase(), t.id]));

    for (const row of parseResult.rows) {
      try {
        // Resolve staff type
        const staffTypeId = row.staff_type
          ? typeMap.get(row.staff_type.toLowerCase()) ?? defaultTypeId
          : defaultTypeId;

        // Find or create profile
        let profileId: string;
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', row.email)
          .eq('organisation_id', organisationId)
          .maybeSingle();

        if (existing) {
          profileId = existing.id;
        } else {
          const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert({
              id: crypto.randomUUID(),
              first_name: row.first_name,
              last_name: row.last_name,
              email: row.email,
              phone: row.phone || null,
              organisation_id: organisationId,
              role: 'member',
            })
            .select('id')
            .single();

          if (error || !newProfile) throw error;
          profileId = newProfile.id;
        }

        // Check for existing member
        const { data: memberRecord } = await supabase
          .from('members')
          .select('id')
          .eq('profile_id', profileId)
          .eq('organisation_id', organisationId)
          .maybeSingle();

        const { error: staffError } = await createStaff({
          profile_id: profileId,
          organisation_id: organisationId,
          staff_type_id: staffTypeId,
          member_id: memberRecord?.id ?? null,
          status: 'active',
          position: row.position || null,
          start_date: row.start_date || new Date().toISOString().split('T')[0],
        });

        if (staffError) throw staffError;
        success++;
      } catch {
        failed++;
      }

      setImportProgress({ success, failed, total });
    }

    setStep('complete');
    toast({
      title: 'Import complete',
      description: `${success} imported, ${failed} failed out of ${total} rows.`,
    });
  };

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with staff data. Required columns: <strong>first_name</strong>, <strong>last_name</strong>, <strong>email</strong>.
              Optional columns: phone, staff_type, position, start_date.
            </p>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-6 py-8 hover:bg-muted/50 w-full justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload CSV</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {parseResult && parseResult.errors.length > 0 && (
              <div className="space-y-2">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'preview' && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <FileText className="mr-1 h-3 w-3" />
                {parseResult.rows.length} rows
              </Badge>
              {parseResult.warnings.length > 0 && (
                <Badge variant="secondary" className="text-amber-600">
                  {parseResult.warnings.length} warnings
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Default Staff Type (for rows without staff_type column)</Label>
              <Select value={defaultTypeId} onValueChange={setDefaultTypeId}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {staffTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-1.5">{row.first_name} {row.last_name}</td>
                      <td className="px-3 py-1.5">{row.email}</td>
                      <td className="px-3 py-1.5">{row.staff_type || '(default)'}</td>
                      <td className="px-3 py-1.5">{row.position || '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parseResult.rows.length > 20 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  ...and {parseResult.rows.length - 20} more rows
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep('upload'); setParseResult(null); }}>
                Back
              </Button>
              <Button onClick={handleImport}>
                Import {parseResult.rows.length} Staff Members
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Importing... {importProgress.success + importProgress.failed} / {importProgress.total}
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((importProgress.success + importProgress.failed) / Math.max(importProgress.total, 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold">Import Complete</p>
              <p className="text-sm text-muted-foreground">
                {importProgress.success} successfully imported
                {importProgress.failed > 0 && `, ${importProgress.failed} failed`}
              </p>
            </div>
            <Button onClick={() => { setStep('upload'); setParseResult(null); }}>
              Import More
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
