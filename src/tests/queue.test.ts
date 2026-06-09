import { describe, it, expect } from 'vitest';
import { buildQueue, needsAttention, queuePriority } from '../domain/queue';

describe('next action queue', () => {
  const now = new Date('2026-06-09T14:00:00.000Z');

  it('prioritizes hot leads', () => {
    const leads = [
      { id: '1', name: 'A', status: 'contacted', createdAt: now.toISOString(), updatedAt: '2026-06-08T10:00:00.000Z' },
      { id: '2', name: 'B', status: 'hot', createdAt: now.toISOString(), updatedAt: '2026-06-09T08:00:00.000Z' }
    ] as any;

    const queue = needsAttention(leads, now);
    expect(queue[0].id).toBe('2');
  });

  it('builds queue metadata for the UI', () => {
    const queue = buildQueue(
      [
        { id: '1', name: 'A', status: 'replied', createdAt: now.toISOString(), updatedAt: '2026-06-08T08:00:00.000Z', email: 'a@example.com' },
        { id: '2', name: 'B', status: 'won', createdAt: now.toISOString(), updatedAt: '2026-06-08T08:00:00.000Z', email: 'b@example.com' }
      ] as any,
      now
    );

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      priority: 'medium',
      reason: 'Lead replied and has been waiting more than a day.',
      lead: { id: '1' },
    });
  });

  it('maps scores to stable priority bands', () => {
    expect(queuePriority(120)).toBe('high');
    expect(queuePriority(70)).toBe('medium');
    expect(queuePriority(30)).toBe('low');
  });
});
