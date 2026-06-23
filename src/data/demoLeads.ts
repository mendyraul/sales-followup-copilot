import type { Lead } from '../domain/lead';

export const demoLeads: Lead[] = [
  {
    id: 'lead-demo-001',
    name: 'Avery Smith',
    email: 'avery@example.com',
    phone: '+1-555-0101',
    status: 'new',
    createdAt: '2026-06-08T12:00:00.000Z',
    updatedAt: '2026-06-08T18:00:00.000Z'
  },
  {
    id: 'lead-demo-002',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    status: 'contacted',
    createdAt: '2026-06-06T15:00:00.000Z',
    updatedAt: '2026-06-07T10:00:00.000Z'
  },
  {
    id: 'lead-demo-003',
    name: 'Morgan Patel',
    email: 'morgan@example.com',
    status: 'hot',
    createdAt: '2026-06-07T09:00:00.000Z',
    updatedAt: '2026-06-08T09:30:00.000Z'
  },
  {
    id: 'lead-demo-004',
    name: 'Casey Nguyen',
    email: 'casey@example.com',
    status: 'replied',
    createdAt: '2026-06-07T08:00:00.000Z',
    updatedAt: '2026-06-09T06:00:00.000Z'
  },
  {
    id: 'lead-demo-005',
    name: 'Taylor Brooks',
    email: 'taylor@example.com',
    status: 'won',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-08T16:00:00.000Z'
  }
];
