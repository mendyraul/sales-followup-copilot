import { describe, expect, it } from 'vitest';
import { getNextAction, needsAttention } from '../domain/queue';

describe('next action queue', () => {
  it('prioritizes hot leads', () => {
    const now = new Date('2026-06-10T03:00:00.000Z');
    const leads = [
      { id: '1', name: 'A', status: 'contacted', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: '2', name: 'B', status: 'hot', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    ] as any;

    const queue = needsAttention(leads, now);
    expect(queue[0].id).toBe('2');
    expect(queue[0].nextAction.label).toContain('high-touch');
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
});
