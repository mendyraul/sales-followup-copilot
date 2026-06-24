import { describe, expect, it } from 'vitest';
import { createAuditEntry, recentAuditEntries, summarizeAuditCoverage } from '../domain/audit';
import { demoAuditLog } from '../data/demoAuditLog';

describe('audit log helpers', () => {
  it('requires a non-empty summary', () => {
    expect(() =>
      createAuditEntry({
        action: 'lead_created',
        entityType: 'lead',
        actor: 'rico',
        summary: '   ',
      })
    ).toThrow('Audit summary is required');
  });

  it('sorts newest audit entries first', () => {
    const entries = recentAuditEntries(demoAuditLog, 3);
    expect(entries).toHaveLength(3);
    expect(entries[0].id).toBe('audit-005');
    expect(entries[2].id).toBe('audit-003');
  });

  it('summarizes audit coverage by event type', () => {
    expect(summarizeAuditCoverage(demoAuditLog)).toEqual({
      totalEvents: 5,
      leadEvents: 2,
      followUpEvents: 1,
      feedbackEvents: 1,
      latestEventAt: '2026-06-10T06:10:00.000Z',
    });
  });
});
