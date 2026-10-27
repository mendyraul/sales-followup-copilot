import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
if (existsSync(".env")) process.loadEnvFile(".env");
const prisma = new PrismaClient();
const seeds = [
  {
    name: "Acme Dental Group",
    email: "owner@acmedental.example",
    phone: "+1-555-0100",
    source: "Website Form",
    status: "NEW",
    notes: "Asked about onboarding timeline and pricing tiers.",
    age: 6,
  },
  {
    name: "BrightPath Coaching",
    email: "hello@brightpath.example",
    phone: "+1-555-0101",
    source: "Referral",
    status: "CONTACTED",
    notes: "Wants weekly check-ins and bilingual templates.",
    age: 72,
  },
  {
    name: "Summit Home Services",
    email: "ops@summithome.example",
    phone: "+1-555-0102",
    source: "Partner",
    status: "HOT",
    notes: "Ready for a trial if CRM sync is confirmed.",
    age: 27,
  },
];
try {
  for (const { age, ...data } of seeds) {
    await prisma.$transaction(async (tx) => {
      // Never reset operator edits when the demo restarts.
      if (await tx.lead.findUnique({ where: { name: data.name } })) return;
      // A renamed seed is still the same contact.
      if (await tx.lead.findFirst({ where: { email: data.email } })) return;
      const lead = await tx.lead.create({
        data: {
          ...data,
          hotLead: data.status === "HOT",
          updatedAt: new Date(Date.now() - age * 3600000),
        },
      });
      await tx.leadEvent.create({
        data: {
          leadId: lead.id,
          eventType: "CREATED",
          payload: JSON.stringify({ source: "fictional demo seed" }),
        },
      });
      await tx.auditLog.create({
        data: {
          action: "lead.seeded",
          entityType: "lead",
          entityId: lead.id,
          payload: JSON.stringify({ fictional: true }),
        },
      });
    });
  }
  console.log("Demo contacts ready; existing leads were preserved.");
} catch (error) {
  console.error("Seed failed:", error.name);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
