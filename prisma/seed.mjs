import { PrismaClient, LeadStatus } from '@prisma/client';

const prisma = new PrismaClient();

const demoLeads = [
  {
    name: 'Acme Dental Group',
    email: 'owner@acmedental.example',
    phone: '+1-555-0100',
    source: 'Website Form',
    status: LeadStatus.NEW,
    notes: 'Asked about onboarding timeline and pricing tiers.'
  },
  {
    name: 'BrightPath Coaching',
    email: 'hello@brightpath.example',
    phone: '+1-555-0101',
    source: 'Referral',
    status: LeadStatus.CONTACTED,
    notes: 'Wants weekly check-ins and bilingual templates.'
  },
  {
    name: 'Summit Home Services',
    email: 'ops@summithome.example',
    phone: '+1-555-0102',
    source: 'Cold Outreach',
    status: LeadStatus.HOT,
    notes: 'Ready for trial if CRM sync is confirmed.'
  }
];

async function main() {
  for (const lead of demoLeads) {
    await prisma.lead.upsert({
      where: { name: lead.name },
      update: lead,
      create: lead
    });
  }

  console.log(`Seeded ${demoLeads.length} demo leads.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
