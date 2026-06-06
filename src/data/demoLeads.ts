import type { Lead } from '../domain/lead';

const now = new Date().toISOString();

export const demoLeads: Lead[] = [
  {
    id: 'lead-demo-001',
    name: 'Avery Smith',
    email: 'avery@example.com',
    phone: '+1-555-0101',
    status: 'new',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'lead-demo-002',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    status: 'contacted',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'lead-demo-003',
    name: 'Morgan Patel',
    email: 'morgan@example.com',
    status: 'hot',
    createdAt: now,
    updatedAt: now
  }
];
