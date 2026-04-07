import type { StaffCsvRow } from '../types';

const REQUIRED_HEADERS = ['first_name', 'last_name', 'email'];
const OPTIONAL_HEADERS = ['phone', 'staff_type', 'position', 'start_date'];
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

export interface CsvParseResult {
  rows: StaffCsvRow[];
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  headers: string[];
}

export function parseStaffCsv(csvText: string): CsvParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const errors: { row: number; message: string }[] = [];
  const warnings: { row: number; message: string }[] = [];
  const rows: StaffCsvRow[] = [];

  if (lines.length < 2) {
    errors.push({ row: 0, message: 'CSV must contain a header row and at least one data row.' });
    return { rows, errors, warnings, headers: [] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      errors.push({ row: 0, message: `Missing required column: ${required}` });
    }
  }

  if (errors.length > 0) {
    return { rows, errors, warnings, headers };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      if (ALL_HEADERS.includes(header)) {
        row[header] = values[idx]?.trim() ?? '';
      }
    });

    if (!row.first_name) {
      errors.push({ row: i + 1, message: 'Missing first name' });
      continue;
    }
    if (!row.last_name) {
      errors.push({ row: i + 1, message: 'Missing last name' });
      continue;
    }
    if (!row.email) {
      errors.push({ row: i + 1, message: 'Missing email' });
      continue;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push({ row: i + 1, message: `Invalid email: ${row.email}` });
      continue;
    }

    if (row.start_date && isNaN(Date.parse(row.start_date))) {
      warnings.push({ row: i + 1, message: `Invalid start_date format, will be ignored: ${row.start_date}` });
      row.start_date = '';
    }

    rows.push({
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone || undefined,
      staff_type: row.staff_type || '',
      position: row.position || undefined,
      start_date: row.start_date || undefined,
    });
  }

  return { rows, errors, warnings, headers };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}
