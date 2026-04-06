'use client';

import { useState, useCallback } from 'react';
import { Download, CheckCircle, XCircle, AlertTriangle, Upload, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/shared/file-upload';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseCsvData } from '@/features/members/services/csv-parser';
import { importMembersFromCsvClient } from '@/features/members/services/member-client-service';
import type { CsvImportResult } from '@/features/members/types/member-types';

const STEPS = ['Upload', 'Preview', 'Confirm', 'Import'] as const;
type Step = 0 | 1 | 2 | 3;

const CSV_TEMPLATE_HEADERS =
  'first_name,last_name,email,phone,date_of_birth,membership_type';
const CSV_TEMPLATE_EXAMPLE =
  'Jane,Smith,jane@example.com,+61400000000,1990-05-15,senior';

function downloadTemplate() {
  const content = [CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_EXAMPLE].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'members-import-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface CsvImportWizardProps {
  orgId: string;
  onImportComplete?: (result: CsvImportResult) => void;
}

export function CsvImportWizard({ orgId, onImportComplete }: CsvImportWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [csvText, setCsvText] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleFileSelected = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  }, []);

  function handlePreview() {
    if (!csvText) return;
    const result = parseCsvData(csvText);
    setParseResult(result);
    setStep(1);
  }

  function handleConfirm() {
    setStep(2);
  }

  async function handleImport() {
    if (!parseResult) return;
    setImporting(true);
    setStep(3);
    setImportProgress(0);

    const total = parseResult.successCount;
    const { importedCount: imported, errors } = await importMembersFromCsvClient(
      orgId,
      parseResult.success,
      (done) => setImportProgress(Math.round((done / total) * 100))
    );

    setImportedCount(imported);
    setImportErrors(errors);
    setImporting(false);
    setImportDone(true);

    onImportComplete?.({
      ...parseResult,
      successCount: imported,
    });
  }

  const progressPercent = importProgress;

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  i < step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : i === step
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 hidden text-xs sm:block',
                  i === step ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-8 sm:w-16',
                  i < step ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Need a template? Download the CSV template with the correct column headers.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="shrink-0 gap-2"
              >
                <Download className="h-4 w-4" />
                Template
              </Button>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium">Required columns:</p>
              <p className="mt-1">first_name, last_name, email, membership_type</p>
              <p className="mt-1 font-medium">Optional columns:</p>
              <p className="mt-1">phone, date_of_birth</p>
              <p className="mt-1">
                Valid membership types:{' '}
                <code className="rounded bg-muted px-1">senior</code>,{' '}
                <code className="rounded bg-muted px-1">junior</code>,{' '}
                <code className="rounded bg-muted px-1">social</code>,{' '}
                <code className="rounded bg-muted px-1">life</code>,{' '}
                <code className="rounded bg-muted px-1">volunteer</code>
              </p>
            </div>

            <FileUpload
              accept=".csv"
              onFilesSelected={handleFileSelected}
            />

            <div className="flex justify-end">
              <Button onClick={handlePreview} disabled={!csvText} className="gap-2">
                Preview Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Preview */}
      {step === 1 && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Preview
              <Badge variant="secondary">{parseResult.totalRows} rows</Badge>
              {parseResult.errorCount > 0 && (
                <Badge variant="destructive">{parseResult.errorCount} errors</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">First Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Last Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.success.map((row, i) => (
                    <tr key={`ok-${i}`} className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">{row.first_name}</td>
                      <td className="px-3 py-2">{row.last_name}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.membership_type}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                  {parseResult.errors.map((err) => (
                    <tr key={`err-${err.row}`} className="border-b bg-red-50">
                      <td className="px-3 py-2 text-muted-foreground">{err.row}</td>
                      <td className="px-3 py-2">{err.data['first_name'] ?? '—'}</td>
                      <td className="px-3 py-2">{err.data['last_name'] ?? '—'}</td>
                      <td className="px-3 py-2">{err.data['email'] ?? '—'}</td>
                      <td className="px-3 py-2">{err.data['membership_type'] ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">{err.errors[0]}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={parseResult.successCount === 0}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-4">
                <CheckCircle className="h-8 w-8 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{parseResult.successCount}</p>
                  <p className="text-sm text-emerald-600">valid rows to import</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-red-50 p-4">
                <XCircle className="h-8 w-8 shrink-0 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{parseResult.errorCount}</p>
                  <p className="text-sm text-red-500">rows with errors (will be skipped)</p>
                </div>
              </div>
            </div>

            {parseResult.errorCount > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {parseResult.errorCount} row{parseResult.errorCount > 1 ? 's' : ''} with validation
                  errors will be skipped. Go back to fix them or proceed with valid rows only.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              This will create {parseResult.successCount} new member record
              {parseResult.successCount !== 1 ? 's' : ''} in your organisation.
            </p>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={parseResult.successCount === 0} className="gap-2">
                Import {parseResult.successCount} Members
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Progress & Results */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {importing ? 'Importing Members...' : 'Import Complete'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {importing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing rows...</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait while members are being imported
                </div>
              </div>
            )}

            {importDone && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-4">
                  <CheckCircle className="h-10 w-10 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-800">Import successful</p>
                    <p className="text-sm text-emerald-600">
                      {importedCount} member{importedCount !== 1 ? 's' : ''} were imported
                      successfully.
                    </p>
                  </div>
                </div>

                {importErrors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="mb-2 text-sm font-medium text-red-700">Errors during import:</p>
                    <ul className="space-y-1">
                      {importErrors.map((err, i) => (
                        <li key={i} className="text-xs text-red-600">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(0);
                      setCsvText('');
                      setParseResult(null);
                      setImportDone(false);
                      setImportProgress(0);
                      setImportedCount(0);
                      setImportErrors([]);
                    }}
                  >
                    Import Another File
                  </Button>
                  <Button asChild>
                    <Link href="/members">View Members</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
