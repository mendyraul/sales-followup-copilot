import { describe, expect, it } from 'vitest';
import { detectStaleLeads } from './staleLeadDetection';

describe('detectStaleLeads', () => {
  const now = new Date('2026-05-30T12:00:00.000Z');

  it('flags lead as stale when inactivity crosses threshold', () => {
    const result = detectStaleLeads(
      [{ leadId: 'l1', leadEmail: 'lead@example.com', lastContactedAt: '2026-05-20T00:00:00.000Z', status: 'active' }],
      { staleAfterDays: 7, now }
    );

    expect(result[0].stale).toBe(true);
    expect(result[0].reason).toBe('inactive-window');
  });

  it('does not mark paused or closed leads as stale', () => {
    const result = detectStaleLeads(
      [
        { leadId: 'l2', leadEmail: 'paused@example.com', status: 'paused', lastContactedAt: '2026-05-01T00:00:00.000Z' },
        { leadId: 'l3', leadEmail: 'closed@example.com', status: 'closed', lastContactedAt: '2026-05-01T00:00:00.000Z' }
      ],
      { now }
    );

    expect(result[0].stale).toBe(false);
    expect(result[1].stale).toBe(false);
  });

  it('marks leads with no activity as stale', () => {
    const result = detectStaleLeads([{ leadId: 'l4', leadEmail: 'new@example.com', status: 'new' }], { staleAfterDays: 3, now });
    expect(result[0]).toMatchObject({ stale: true, reason: 'missing-contact' });
  });
});
