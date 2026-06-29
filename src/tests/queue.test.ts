import { describe, it, expect } from 'vitest';
import { demoLeads } from '../data/demoLeads';
import { buildQueue, getNextAction, groupQueueByPriority, needsAttention, nextActionScore, queuePriority } from '../domain/queue';

describe('next action queue', () => {
  const now = new Date('2026-06-09T14:00:00.000Z');

  it('prioritizes hot leads', () => {
    const now = new Date('2026-06-10T03:00:00.000Z');
    const leads = [
      { id: '1', name: 'A', status: 'contacted', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: '2', name: 'B', status: 'hot', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    ] as any;

    const queue = needsAttention(leads, now);
    expect(queue[0].id).toBe('2');
    expect(queue[0].nextAction.label).toContain('high-touch');
    expect(queue[0].nextAction.band).toBe('urgent');
  });

  it('adds actionable metadata for replied leads', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const lead = {
      id: 'reply-1',
      name: 'Reply Lead',
      status: 'replied',
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T06:00:00.000Z',
    } as any;

    const action = getNextAction(lead, now);
    expect(action.band).toBe('today');
    expect(action.followUpStage).toBe('prepare the next personalized response');
    expect(action.reason).toContain('replied');
  });

  it('sorts aged replied leads ahead of fresh contacted leads', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const leads = [
      {
        id: 'contacted-fresh',
        name: 'Contacted Fresh',
        status: 'contacted',
        createdAt: '2026-06-10T11:00:00.000Z',
        updatedAt: '2026-06-10T11:00:00.000Z',
      },
      {
        id: 'reply-aged',
        name: 'Reply Aged',
        status: 'replied',
        createdAt: '2026-06-08T12:00:00.000Z',
        updatedAt: '2026-06-09T06:00:00.000Z',
      },
    ] as any;

    const queue = needsAttention(leads, now);
    expect(queue[0].id).toBe('reply-aged');
    expect(queue[0].nextAction.band).toBe('today');
    expect(queue[1].nextAction.band).toBe('soon');
  });

  it('ignores closed-out leads and clamps future timestamps to zero age', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const leads = [
      {
        id: 'future-new',
        name: 'Future New',
        status: 'new',
        createdAt: '2026-06-10T12:00:00.000Z',
        updatedAt: '2026-06-11T12:00:00.000Z',
      },
      {
        id: 'won-lead',
        name: 'Won Lead',
        status: 'won',
        createdAt: '2026-06-08T12:00:00.000Z',
        updatedAt: '2026-06-08T12:00:00.000Z',
      },
    ] as any;

    const queue = needsAttention(leads, now);
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe('future-new');
    expect(queue[0].nextAction.ageHours).toBe(0);
    expect(queue[0].nextAction.band).toBe('soon');
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

  it('groups queue items into operator-facing priority lanes', () => {
    const queue = buildQueue(
      [
        { id: 'hot', name: 'Hot lead', status: 'hot', createdAt: now.toISOString(), updatedAt: '2026-06-08T08:00:00.000Z' },
        { id: 'replied', name: 'Replied lead', status: 'replied', createdAt: now.toISOString(), updatedAt: '2026-06-08T18:00:00.000Z' },
        { id: 'new', name: 'New lead', status: 'new', createdAt: now.toISOString(), updatedAt: '2026-06-09T12:00:00.000Z' },
      ] as any,
      now
    );

    const groups = groupQueueByPriority(queue);

    expect(groups.high.map((item) => item.lead.id)).toEqual(['hot']);
    expect(groups.medium.map((item) => item.lead.id)).toEqual(['replied']);
    expect(groups.low.map((item) => item.lead.id)).toEqual(['new']);
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

  it('keeps seeded dashboard ordering aligned between needsAttention and buildQueue', () => {
    const attentionOrder = needsAttention(demoLeads).map((lead) => lead.id);
    const queueOrder = buildQueue(demoLeads).map((item) => item.lead.id);

    expect(queueOrder).toEqual(attentionOrder);
  });
});
