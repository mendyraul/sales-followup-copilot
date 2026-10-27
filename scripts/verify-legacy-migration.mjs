// Destructive only to the explicitly supplied, disposable upgrade test database.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const url = process.env.DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("/sales_followup_upgrade_test"))
  throw new Error("Use a disposable sales_followup_upgrade_test database.");
const db = new PrismaClient();
try {
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new PrismaClient({
    datasources: { db: { url: adminUrl.toString() } },
  });
  try {
    const existing =
      await admin.$queryRaw`SELECT 1 FROM pg_database WHERE datname = 'sales_followup_upgrade_test'`;
    if (!existing.length)
      await admin.$executeRawUnsafe(
        "CREATE DATABASE sales_followup_upgrade_test",
      );
  } finally {
    await admin.$disconnect();
  }
  const initial = readFileSync(
    "prisma/migrations/202610270001_initial/migration.sql",
    "utf8",
  );
  // Initial DDL contains no quoted semicolons or procedural SQL.
  for (const sql of initial.split(";").filter((s) => s.trim()))
    await db.$executeRawUnsafe(sql);
  await db.$executeRaw`INSERT INTO "Lead" ("id", "name", "status", "updatedAt") VALUES ('legacy-lead', 'Legacy Buyer', 'CONTACTED', NOW())`;
  await db.$executeRaw`INSERT INTO "FollowUpDraft" ("id", "leadId", "stage", "content", "approved") VALUES ('legacy-draft', 'legacy-lead', 'first', 'Preserve this approved text', true)`;
  execFileSync(
    "node_modules/.bin/prisma",
    ["migrate", "resolve", "--applied", "202610270001_initial"],
    { stdio: "inherit", env: process.env },
  );
  execFileSync("node_modules/.bin/prisma", ["migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
  const lead = await db.lead.findUniqueOrThrow({
    where: { id: "legacy-lead" },
    include: { drafts: { include: { revisions: true } } },
  });
  if (
    lead.drafts[0].content !== "Preserve this approved text" ||
    !lead.drafts[0].approved ||
    lead.drafts[0].revisions[0].content !== lead.drafts[0].content ||
    lead.drafts[0].revisions[0].decision !== "approved"
  )
    throw new Error("Legacy preservation failed.");
  console.log(
    "Legacy migration preserved lead, approved draft and baseline revision.",
  );
} finally {
  await db.$disconnect();
}
