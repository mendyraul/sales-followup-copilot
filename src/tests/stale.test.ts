import { describe, expect, it } from 'vitest';
import type { Lead } from '../domain/lead';
import { detectStaleLeads, staleLeadSummary } from '../domain/stale';

const now = new Date('2026-06-09T12:00:00.000Z');

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: overrides.id ?? 'lead-1',
    name: overrides.name ?? 'Lead',
    status: overrides.status ?? 'new',
    createdAt: overrides.createdAt ?? '2026-06-01T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-01T12:00:00.000Z',
    email: overrides.email,
    phone: overrides.phone
  };
}

describe('stale lead detection', () => {
  it('flags active leads as stale when inactivity crosses the threshold', () => {
    const result = detectStaleLeads(
      [makeLead({ id: 'stale', status: 'contacted', updatedAt: '2026-05-30T12:00:00.000Z' })],
      { staleAfterDays: 7, now }
    );

    expect(result[0]).toMatchObject({
      stale: true,
      staleDays: 10,
      reason: 'inactive-window'
    });
  });

  it('does not mark recently touched leads as stale', () => {
    const result = detectStaleLeads(
      [makeLead({ id: 'fresh', status: 'replied', updatedAt: '2026-06-07T12:00:00.000Z' })],
      { staleAfterDays: 7, now }
    );

    expect(result[0].stale).toBe(false);
    expect(result[0].staleDays).toBe(2);
  });

  it('never marks won or lost leads as stale', () => {
    const result = detectStaleLeads(
      [
        makeLead({ id: 'won', status: 'won', updatedAt: '2026-05-01T12:00:00.000Z' }),
        makeLead({ id: 'lost', status: 'lost', updatedAt: '2026-05-01T12:00:00.000Z' })
      ],
      { staleAfterDays: 3, now }
    );

    expect(result.every((entry) => entry.stale === false)).toBe(true);
    expect(result.map((entry) => entry.reason)).toEqual(['status-closed', 'status-closed']);
  });

  it('returns stale leads in descending order for dashboards', () => {
    const result = staleLeadSummary(
      [
        makeLead({ id: 'oldest', updatedAt: '2026-05-20T12:00:00.000Z' }),
        makeLead({ id: 'middle', updatedAt: '2026-05-28T12:00:00.000Z' }),
        makeLead({ id: 'fresh', updatedAt: '2026-06-08T12:00:00.000Z' })
      ],
      { staleAfterDays: 7, now }
    );

    expect(result.map((entry) => entry.lead.id)).toEqual(['oldest', 'middle']);
  });
});
