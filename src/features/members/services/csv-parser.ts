import { csvImportRowSchema } from '@/features/members/schemas/member-schemas';
import type { CsvImportResult, CsvImportRow } from '@/features/members/types/member-types';

export function parseCsvData(csvText: string): CsvImportResult {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    return {
      success: [],
      errors: [],
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
    };
  }

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/"/g, ''));

  const success: CsvImportRow[] = [];
  const errors: CsvImportResult['errors'] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const rawRow: Record<string, string> = {};

    headers.forEach((header, index) => {
      rawRow[header] = values[index] ?? '';
    });

    const result = csvImportRowSchema.safeParse({
      first_name: rawRow['first_name'] || rawRow['firstname'] || rawRow['first name'],
      last_name: rawRow['last_name'] || rawRow['lastname'] || rawRow['last name'],
      email: rawRow['email'],
      phone: rawRow['phone'] || undefined,
      date_of_birth: rawRow['date_of_birth'] || rawRow['dob'] || undefined,
      membership_type: rawRow['membership_type'] || rawRow['type'],
    });

    if (result.success) {
      success.push(result.data);
    } else {
      errors.push({
        row: i,
        data: rawRow,
        errors: result.error.issues.map((issue) => issue.message),
      });
    }
  }

  return {
    success,
    errors,
    totalRows: lines.length - 1,
    successCount: success.length,
    errorCount: errors.length,
  };
}

export function generateCsvTemplate(): string {
  return 'first_name,last_name,email,phone,date_of_birth,membership_type\nJohn,Smith,john@example.com,0400000000,1990-01-15,senior';
}
