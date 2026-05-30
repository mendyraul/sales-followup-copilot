export type DemoLead = {
  name: string;
  company: string;
  email: string;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  lastContactedAt: string;
  notes?: string;
};

const DEMO_LEADS: DemoLead[] = [
  {
    name: 'Jordan Lee',
    company: 'Northstar Dental Group',
    email: 'jordan@northstardental.example',
    stage: 'qualified',
    lastContactedAt: '2026-05-24T14:30:00.000Z',
    notes: 'Requested pricing breakdown for team of 8.'
  },
  {
    name: 'Avery Patel',
    company: 'Summit Realty Advisors',
    email: 'avery@summitrealty.example',
    stage: 'contacted',
    lastContactedAt: '2026-05-27T18:00:00.000Z'
  },
  {
    name: 'Taylor Kim',
    company: 'Cedar Ops Consulting',
    email: 'taylor@cedarops.example',
    stage: 'proposal',
    lastContactedAt: '2026-05-29T10:15:00.000Z',
    notes: 'Waiting on legal review from customer side.'
  }
];

export function getDemoLeads(): DemoLead[] {
  return DEMO_LEADS.map((lead) => ({ ...lead }));
}
