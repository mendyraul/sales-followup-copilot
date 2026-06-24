import { describe, expect, it } from 'vitest';
import { getHotLeadFlag, listHotLeads } from '../domain/hot-lead';

const now = new Date('2026-06-09T20:00:00.000Z');

describe('getHotLeadFlag', () => {
  it('marks explicit hot status as hot', () => {
    const result = getHotLeadFlag({
      id: 'lead-1',
      name: 'Jordan',
      status: 'hot',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, now);

    expect(result.isHot).toBe(true);
    expect(result.reason).toMatch(/marked hot/i);
  });

  it('promotes aged replied leads into hot review', () => {
    const updatedAt = new Date(now.getTime() - 35 * 60 * 60 * 1000).toISOString();
    const result = getHotLeadFlag({
      id: 'lead-2',
      name: 'Morgan',
      status: 'replied',
      createdAt: now.toISOString(),
      updatedAt,
    }, now);

    expect(result.isHot).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('keeps lower-urgency leads in the regular queue', () => {
    const result = getHotLeadFlag({
      id: 'lead-3',
      name: 'Avery',
      status: 'contacted',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }, now);

    expect(result.isHot).toBe(false);
  });
});

describe('listHotLeads', () => {
  it('returns only hot leads sorted by score descending', () => {
    const hotLeads = listHotLeads([
      { id: 'a', name: 'A', status: 'contacted', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: 'b', name: 'B', status: 'hot', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: 'c', name: 'C', status: 'replied', createdAt: now.toISOString(), updatedAt: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString() },
    ] as any, now);

    expect(hotLeads.map((lead) => lead.id)).toEqual(['b', 'c']);
  });
});
