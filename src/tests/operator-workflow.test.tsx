import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePage from '../app/page';
import { demoAuditLog } from '../data/demoAuditLog';
import { demoLeads } from '../data/demoLeads';
import { demoLeadNotes, demoTimelineEntries } from '../data/demoTimeline';
import { recentAuditEntries, summarizeAuditCoverage } from '../domain/audit';
import { parseLeadCsvPreview } from '../domain/csv-import';
import { needsAttention, nextActionScore } from '../domain/queue';
import { entriesForLead, notesForLead, summarizeTimeline } from '../domain/timeline';

describe('operator workflow regression', () => {
  it('keeps the seeded queue and audit trail aligned for manual QA', () => {
    const queue = needsAttention(demoLeads);
    const coverage = summarizeAuditCoverage(demoAuditLog);
    const latestEvents = recentAuditEntries(demoAuditLog, 4);
    const timelineSummary = summarizeTimeline(demoTimelineEntries, demoLeadNotes);
    const csvPreview = parseLeadCsvPreview(`name,email,phone,source,status\nAvery Smith,avery@example.com,+1-555-0101,Referral,new\nJordan Lee,jordan@example.com,,Website,contacted\nPat Rivera,pat@example.com,+1-555-0104,"Partner, East",hot\nJordan Lee,jordan@example.com,+1-555-0102,,replied\nNo Email,,+1-555-0110,Tradeshow,new`);
    const leadThreeTimeline = entriesForLead(demoTimelineEntries, 'lead-demo-003');
    const leadThreeNotes = notesForLead(demoLeadNotes, 'lead-demo-003');

    expect(queue).toHaveLength(3);
    expect(queue.map((lead) => lead.id)).toEqual(['lead-demo-003', 'lead-demo-002', 'lead-demo-001']);
    expect(queue[0]).toMatchObject({
      status: 'hot',
    });
    expect(nextActionScore(queue[0])).toBeGreaterThan(nextActionScore(queue[1]));

    expect(coverage).toMatchObject({
      totalEvents: 5,
      leadEvents: 2,
      followUpEvents: 1,
      feedbackEvents: 1,
    });
    expect(latestEvents.map((entry) => entry.id)).toEqual(['audit-005', 'audit-004', 'audit-003', 'audit-002']);
    expect(latestEvents[0]).toMatchObject({
      action: 'system_mode_checked',
      entityType: 'system',
    });

    expect(timelineSummary).toMatchObject({
      totalEvents: 5,
      totalNotes: 3,
    });
    expect(csvPreview.validRows).toHaveLength(4);
    expect(csvPreview.duplicateEmails).toEqual(['jordan@example.com']);
    expect(csvPreview.issues).toEqual([{ rowNumber: 6, message: 'Missing required email' }]);
    expect(leadThreeTimeline.map((entry) => entry.id)).toEqual(['timeline-005', 'timeline-004', 'timeline-003']);
    expect(leadThreeNotes[0]?.body).toContain('softer tone');
  });

  it('renders the dashboard with the key QA checkpoints visible', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('Sales Follow-Up Copilot');
    expect(html).toContain('Tracked leads');
    expect(html).toContain('Queue items');
    expect(html).toContain('Safety mode');
    expect(html).toContain('Recent audit log');
    expect(html).toContain('Audit coverage');
    expect(html).toContain('Lead timeline');
    expect(html).toContain('Timeline summary');
    expect(html).toContain('CSV import preview');
    expect(html).toContain('CSV preview rows');
    expect(html).toContain('Blocked rows');
    expect(html).toContain('Structured notes');
    expect(html).toContain('manual');
    expect(html).toContain('Lead events: 2');
    expect(html).toContain('Feedback events: 1');
  });
});
