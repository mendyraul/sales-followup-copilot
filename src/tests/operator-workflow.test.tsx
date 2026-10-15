import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePage from '../app/page';
import { demoAuditLog } from '../data/demoAuditLog';
import { demoDeploymentChecklist } from '../data/demoDeploymentChecklist';
import { demoDraftHistory } from '../data/demoDraftHistory';
import { demoFeedbackEntries } from '../data/demoFeedback';
import { demoLeads } from '../data/demoLeads';
import { demoManualQaChecklist } from '../data/demoManualQaChecklist';
import { demoLeadNotes, demoTimelineEntries } from '../data/demoTimeline';
import { recentAuditEntries, summarizeAuditCoverage } from '../domain/audit';
import { parseLeadCsvPreview } from '../domain/csv-import';
import { summarizeDeploymentChecklist } from '../domain/deployment';
import { buildDraftThreads, summarizeDraftHistory } from '../domain/draft-history';
import { feedbackHotspots, recentFeedback, summarizeFeedback } from '../domain/feedback';
import { summarizeManualQaChecklist } from '../domain/manual-qa';
import { buildQueue, needsAttention, nextActionScore } from '../domain/queue';
import { entriesForLead, notesForLead, summarizeTimeline } from '../domain/timeline';

describe('operator workflow regression', () => {
  it('keeps the seeded queue and audit trail aligned for manual QA', () => {
    const queue = needsAttention(demoLeads);
    const dashboardQueue = buildQueue(demoLeads);
    const coverage = summarizeAuditCoverage(demoAuditLog);
    const latestEvents = recentAuditEntries(demoAuditLog, 4);
    const manualQaSummary = summarizeManualQaChecklist(demoManualQaChecklist);
    const deploymentSummary = summarizeDeploymentChecklist(demoDeploymentChecklist);
    const feedbackSummary = summarizeFeedback(demoFeedbackEntries);
    const latestFeedback = recentFeedback(demoFeedbackEntries);
    const hotspots = feedbackHotspots(demoFeedbackEntries);
    const timelineSummary = summarizeTimeline(demoTimelineEntries, demoLeadNotes);
    const draftThreads = buildDraftThreads(demoDraftHistory);
    const draftHistorySummary = summarizeDraftHistory(demoDraftHistory);
    const csvPreview = parseLeadCsvPreview(`name,email,phone,source,status\nAvery Smith,avery@example.com,+1-555-0101,Referral,new\nJordan Lee,jordan@example.com,,Website,contacted\nPat Rivera,pat@example.com,+1-555-0104,"Partner, East",hot\nJordan Lee,jordan@example.com,+1-555-0102,,replied\nNo Email,,+1-555-0110,Tradeshow,new`);
    const leadThreeTimeline = entriesForLead(demoTimelineEntries, 'lead-demo-003');
    const leadThreeNotes = notesForLead(demoLeadNotes, 'lead-demo-003');

    expect(queue).toHaveLength(4);
    expect(queue.map((lead) => lead.id)).toEqual(['lead-demo-003', 'lead-demo-004', 'lead-demo-002', 'lead-demo-001']);
    expect(queue[0]).toMatchObject({
      status: 'hot',
    });
    expect(dashboardQueue[0].nextAction).toMatchObject({
      label: 'Call or send a high-touch follow-up now',
      followUpStage: 'jump to a high-priority follow-up',
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

    expect(manualQaSummary).toEqual({
      totalItems: 5,
      readyItems: 4,
      watchItems: 1,
      areas: ['startup', 'queue', 'timeline', 'import', 'outbound'],
    });
    expect(deploymentSummary).toEqual({
      totalItems: 4,
      readyItems: 3,
      watchItems: 1,
      areas: ['environment', 'database', 'application', 'rollback'],
    });
    expect(feedbackSummary).toEqual({
      total: 3,
      categories: { ux: 1, bug: 1, result_quality: 1, other: 0 },
      sentiments: { positive: 1, neutral: 1, negative: 1 },
      averageScore: 3.3,
      latestAt: '2026-06-10T07:32:00.000Z',
      openCount: 2,
      resolvedCount: 1,
    });
    expect(latestFeedback[0]).toMatchObject({
      id: 'feedback-demo-003',
      sentiment: 'negative',
    });
    expect(hotspots[0]).toEqual({
      leadId: 'lead-demo-001',
      totalEntries: 1,
      openEntries: 1,
      negativeEntries: 1,
      latestAt: '2026-06-10T07:32:00.000Z',
    });

    expect(timelineSummary).toMatchObject({
      totalEvents: 5,
      totalNotes: 3,
    });
    expect(draftHistorySummary).toEqual({
      totalThreads: 3,
      totalRevisions: 5,
      revisedThreads: 1,
      pendingThreads: 1,
      approvedThreads: 1,
      rejectedThreads: 1,
      latestUpdatedAt: '2026-06-10T07:28:00.000Z',
    });
    expect(draftThreads[0]).toMatchObject({
      latestDecision: 'approve',
      latestActor: 'raul',
    });
    expect(draftThreads[0]?.history.map((revision) => revision.id)).toEqual(['draft-demo-001', 'draft-demo-001-v2']);
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
    expect(html).toContain('Next action queue');
    expect(html).toContain('Call or send a high-touch follow-up now');
    expect(html).toContain('Next step: jump to a high-priority follow-up');
    expect(html).toContain('Manual QA checklist');
    expect(html).toContain('Checklist coverage');
    expect(html).toContain('Safety mode');
    expect(html).toContain('Recent audit log');
    expect(html).toContain('Audit coverage');
    expect(html).toContain('Lead timeline');
    expect(html).toContain('Timeline summary');
    expect(html).toContain('Draft review history');
    expect(html).toContain('Revision coverage');
    expect(html).toContain('Stage guide');
    expect(html).toContain('Deployment readiness');
    expect(html).toContain('Release summary');
    expect(html).toContain('Deploy checkpoints');
    expect(html).toContain('Feedback capture inbox');
    expect(html).toContain('Feedback hotspots');
    expect(html).toContain('Repeat issue watchlist');
    expect(html).toContain('Action hint:');
    expect(html).toContain('Next step:');
    expect(html).toContain('Triage state:');
    expect(html).toContain('urgent');
    expect(html).toContain('Feedback summary');
    expect(html).toContain('Feedback entries');
    expect(html).toContain('Open items');
    expect(html).toContain('Resolved items');
    expect(html).toContain('Pat Rivera');
    expect(html).toContain('HOT');
    expect(html).toContain('Avery Smith');
    expect(html).toContain('CSV import preview');
    expect(html).toContain('CSV preview rows');
    expect(html).toContain('Manual QA checks');
    expect(html).toContain('Blocked rows');
    expect(html).toContain('Structured notes');
    expect(html).toContain('Tracked draft threads');
    expect(html).toContain('Pending approvals');
    expect(html).toContain('manual');
    expect(html).toContain('Lead events: 2');
    expect(html).toContain('Feedback events: 1');
  });
});
