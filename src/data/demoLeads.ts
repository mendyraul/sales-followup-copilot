import type { Lead } from '../domain/lead';

const now = Date.parse('2026-06-09T12:00:00.000Z');
const hour = 1000 * 60 * 60;
const day = hour * 24;

function iso(offsetMs: number): string {
  return new Date(now - offsetMs).toISOString();
}

export const demoLeads: Lead[] = [
  {
    id: 'lead-demo-001',
    name: 'Avery Smith',
    email: 'avery@example.com',
    phone: '+1-555-0101',
    status: 'new',
    createdAt: iso(day * 10),
    updatedAt: iso(day * 9)
  },
  {
    id: 'lead-demo-002',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    status: 'contacted',
    createdAt: iso(day * 6),
    updatedAt: iso(day * 2)
  },
  {
    id: 'lead-demo-003',
    name: 'Morgan Patel',
    email: 'morgan@example.com',
    status: 'hot',
    createdAt: iso(day * 4),
    updatedAt: iso(hour * 12)
  },
  {
    id: 'lead-demo-004',
    name: 'Taylor Brooks',
    email: 'taylor@example.com',
    status: 'replied',
    createdAt: iso(day * 12),
    updatedAt: iso(day * 8)
  }
];
