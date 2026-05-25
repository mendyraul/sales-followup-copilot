#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return row;
  });
}

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npm run import:csv -- <path-to-csv>');
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.email || !row.name) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.lead.findFirst({ where: { email: row.email } });
    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          source: row.source || existing.source,
          status: row.status || existing.status,
        },
      });
    } else {
      await prisma.lead.create({
        data: {
          email: row.email,
          name: row.name,
          source: row.source || null,
          status: row.status || 'NEW',
        },
      });
    }

    created += 1;
  }

  console.log(`Imported/updated ${created} leads. Skipped ${skipped} rows.`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
