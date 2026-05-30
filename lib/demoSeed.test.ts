import { describe, it, expect } from 'vitest';
import { getDemoLeads } from './demoSeed';

describe('getDemoLeads', () => {
  it('returns at least three realistic demo leads', () => {
    const leads = getDemoLeads();
    expect(leads.length).toBeGreaterThanOrEqual(3);
    for (const lead of leads) {
      expect(lead.name).toBeTruthy();
      expect(lead.company).toBeTruthy();
      expect(lead.email).toContain('@');
      expect(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).toContain(lead.stage);
    }
  });

  it('returns a defensive copy', () => {
    const leads = getDemoLeads();
    leads[0].name = 'Mutated';
    const fresh = getDemoLeads();
    expect(fresh[0].name).not.toBe('Mutated');
  });
});
