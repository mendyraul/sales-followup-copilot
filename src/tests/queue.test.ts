import { describe, it, expect } from 'vitest';
import { needsAttention } from '../domain/queue';

describe('next action queue', () => {
  it('prioritizes hot leads', () => {
    const leads = [
      { id: '1', name: 'A', status: 'contacted', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', name: 'B', status: 'hot', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ] as any;

    const queue = needsAttention(leads);
    expect(queue[0].id).toBe('2');
  });
});
