import { describe, it, expect } from 'vitest';
import { demoLeads } from '../data/demoLeads';

describe('demoLeads seed data', () => {
  it('contains at least three demo leads', () => {
    expect(demoLeads.length).toBeGreaterThanOrEqual(3);
  });

  it('uses unique IDs', () => {
    const ids = demoLeads.map((lead) => lead.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
