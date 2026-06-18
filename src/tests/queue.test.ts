import { describe, it, expect } from 'vitest';
import { needsAttention, nextActionScore } from '../domain/queue';

describe('next action queue', () => {
  it('prioritizes hot leads', () => {
    const leads = [
      { id: '1', name: 'A', status: 'contacted', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', name: 'B', status: 'hot', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ] as any;

    const queue = needsAttention(leads);
    expect(queue[0].id).toBe('2');
  });

  it('uses lead age to break ties within the same status bucket', () => {
    const now = new Date('2026-06-18T19:53:00.000Z');
    const leads = [
      { id: 'fresh', name: 'Fresh Lead', status: 'contacted', createdAt: now.toISOString(), updatedAt: '2026-06-18T18:53:00.000Z' },
      { id: 'stale', name: 'Stale Lead', status: 'contacted', createdAt: now.toISOString(), updatedAt: '2026-06-16T19:53:00.000Z' }
    ] as any;

    const queue = needsAttention(leads, now as any);
    expect(queue.map((lead) => lead.id)).toEqual(['stale', 'fresh']);
    expect(nextActionScore(queue[0], now)).toBeGreaterThan(nextActionScore(queue[1], now));
  });

  it('filters out terminal statuses from the operator queue', () => {
    const now = new Date('2026-06-18T19:53:00.000Z');
    const leads = [
      { id: 'new-lead', name: 'New Lead', status: 'new', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: 'won-lead', name: 'Won Lead', status: 'won', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: 'lost-lead', name: 'Lost Lead', status: 'lost', createdAt: now.toISOString(), updatedAt: now.toISOString() }
    ] as any;

    const queue = needsAttention(leads, now as any);
    expect(queue.map((lead) => lead.id)).toEqual(['new-lead']);
  });
});
