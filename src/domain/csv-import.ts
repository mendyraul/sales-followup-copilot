import type { LeadStatus } from './lead';

const allowedStatuses: LeadStatus[] = ['new', 'contacted', 'replied', 'hot', 'won', 'lost'];
const requiredHeaders = ['name', 'email'] as const;
const optionalHeaders = ['phone', 'source', 'status'] as const;
const acceptedHeaders = [...requiredHeaders, ...optionalHeaders];

export type CsvLeadRow = {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  warnings: string[];
};

export type CsvImportIssue = {
  rowNumber: number;
  message: string;
};

export type CsvImportPreview = {
  headers: string[];
  validRows: CsvLeadRow[];
  issues: CsvImportIssue[];
  duplicateEmails: string[];
  missingHeaders: string[];
  unknownHeaders: string[];
};

export function parseLeadCsvPreview(content: string): CsvImportPreview {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return emptyPreview();
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  const unknownHeaders = headers.filter((header) => !acceptedHeaders.includes(header as (typeof acceptedHeaders)[number]));
  const validRows: CsvLeadRow[] = [];
  const issues: CsvImportIssue[] = [];
  const emailCounts = new Map<string, number>();

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const cols = splitCsvLine(line);
    const raw = Object.fromEntries(headers.map((header, columnIndex) => [header, (cols[columnIndex] ?? '').trim()]));

    const rowIssues: string[] = [];
    const name = raw.name ?? '';
    const email = (raw.email ?? '').toLowerCase();
    const phone = raw.phone ?? '';
    const source = raw.source ?? '';
    const normalizedStatus = normalizeStatus(raw.status ?? 'new');
    const warnings: string[] = [];

    if (!name) {
      rowIssues.push('Missing required name');
    }

    if (!email) {
      rowIssues.push('Missing required email');
    } else if (!looksLikeEmail(email)) {
      rowIssues.push('Email must look valid');
    }

    if (!normalizedStatus) {
      rowIssues.push(`Unsupported status: ${raw.status}`);
    }

    if (!source) {
      warnings.push('No source provided');
    }

    if (!phone) {
      warnings.push('No phone provided');
    }

    if (rowIssues.length > 0 || !normalizedStatus) {
      rowIssues.forEach((message) => issues.push({ rowNumber, message }));
      return;
    }

    emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
    validRows.push({
      rowNumber,
      name,
      email,
      phone,
      source,
      status: normalizedStatus,
      warnings,
    });
  });

  const duplicateEmails = [...emailCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([email]) => email)
    .sort();

  if (duplicateEmails.length > 0) {
    for (const row of validRows) {
      if (duplicateEmails.includes(row.email)) {
        row.warnings = [...row.warnings, 'Duplicate email appears multiple times in this import'];
      }
    }
  }

  return {
    headers,
    validRows,
    issues,
    duplicateEmails,
    missingHeaders,
    unknownHeaders,
  };
}

function emptyPreview(): CsvImportPreview {
  return {
    headers: [],
    validRows: [],
    issues: [],
    duplicateEmails: [],
    missingHeaders: [],
    unknownHeaders: [],
  };
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeStatus(value: string): LeadStatus | null {
  const normalized = value.trim().toLowerCase();
  if (allowedStatuses.includes(normalized as LeadStatus)) {
    return normalized as LeadStatus;
  }

  if (!normalized) {
    return 'new';
  }

  return null;
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}
