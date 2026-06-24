import type { LeadNoteEntry, LeadTimelineEntry } from '../domain/timeline';

export const demoTimelineEntries: LeadTimelineEntry[] = [
  {
    id: 'timeline-001',
    leadId: 'lead-demo-001',
    type: 'lead_created',
    actor: 'rico-demo',
    summary: 'Captured Avery Smith from the website pricing form.',
    createdAt: '2026-06-10T06:10:00.000Z',
  },
  {
    id: 'timeline-002',
    leadId: 'lead-demo-002',
    type: 'status_changed',
    actor: 'rico-demo',
    summary: 'Moved Jordan Lee to contacted after the first outreach attempt.',
    createdAt: '2026-06-10T06:40:00.000Z',
  },
  {
    id: 'timeline-003',
    leadId: 'lead-demo-003',
    type: 'follow_up_drafted',
    actor: 'mock-ai',
    summary: 'Generated a follow-up draft for Morgan Patel in manual-review mode.',
    createdAt: '2026-06-10T07:00:00.000Z',
  },
  {
    id: 'timeline-004',
    leadId: 'lead-demo-003',
    type: 'feedback_captured',
    actor: 'qa-reviewer',
    summary: 'Captured QA feedback to tighten the opening sentence before approval.',
    createdAt: '2026-06-10T07:08:00.000Z',
  },
  {
    id: 'timeline-005',
    leadId: 'lead-demo-003',
    type: 'follow_up_reviewed',
    actor: 'account-owner',
    summary: 'Marked the revised draft as ready for the next manual send review.',
    createdAt: '2026-06-10T07:12:00.000Z',
  },
];

export const demoLeadNotes: LeadNoteEntry[] = [
  {
    id: 'note-001',
    leadId: 'lead-demo-001',
    body: 'Asked for pricing details and wants a follow-up after the Tuesday ops review.',
    createdAt: '2026-06-10T06:18:00.000Z',
  },
  {
    id: 'note-002',
    leadId: 'lead-demo-002',
    body: 'Phone call went to voicemail. Next step is a short value-focused email with two proof points.',
    createdAt: '2026-06-10T06:45:00.000Z',
  },
  {
    id: 'note-003',
    leadId: 'lead-demo-003',
    body: 'Champion asked for a softer tone and a scheduling link before they loop finance back in.',
    createdAt: '2026-06-10T07:05:00.000Z',
    updatedAt: '2026-06-10T07:09:00.000Z',
  },
];
