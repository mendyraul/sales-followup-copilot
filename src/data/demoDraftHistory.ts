import {
  approveDraft,
  createDraft,
  editDraft,
  rejectDraft,
  type FollowUpDraftRecord,
} from '../../lib/draftWorkflow';

const leadOneDraft = createDraft({
  id: 'draft-demo-001',
  leadId: 'lead-demo-001',
  stage: 'drafted',
  content: 'Checking in after the walkthrough to see whether a pricing review would help.',
  now: new Date('2026-06-10T07:05:00.000Z'),
});

const leadOneRevisionOne = editDraft(leadOneDraft, {
  actor: 'raul',
  notes: 'Shorten the opening and make the CTA easier to scan.',
  content: 'Wanted to follow up after the walkthrough and share a quick pricing recap.',
  now: new Date('2026-06-10T07:14:00.000Z'),
});

const leadOneRevisionTwo = editDraft(leadOneRevisionOne.nextDraft, {
  actor: 'rico',
  notes: 'Keep the CTA manual-safe and point to a short next step.',
  content: 'Wanted to follow up after the walkthrough and see if a short pricing recap this week would help.',
  now: new Date('2026-06-10T07:24:00.000Z'),
});

const leadOneApproved = approveDraft(leadOneRevisionTwo.nextDraft, {
  actor: 'raul',
  notes: 'Approved for manual send after the next product check-in.',
  now: new Date('2026-06-10T07:28:00.000Z'),
});

const leadTwoDraft = rejectDraft(
  createDraft({
    id: 'draft-demo-002',
    leadId: 'lead-demo-002',
    stage: 'drafted',
    content: 'Circling back to see whether you are ready to move forward today.',
    now: new Date('2026-06-10T07:18:00.000Z'),
  }),
  {
    actor: 'raul',
    notes: 'Too aggressive for a lead that just asked for more technical detail.',
    now: new Date('2026-06-10T07:22:00.000Z'),
  },
);

const leadThreeDraft = createDraft({
  id: 'draft-demo-003',
  leadId: 'lead-demo-003',
  stage: 'drafted',
  content: 'Following up with the onboarding checklist we mentioned during the hot-lead review.',
  now: new Date('2026-06-10T07:26:00.000Z'),
});

export const demoDraftHistory: FollowUpDraftRecord[] = [
  leadOneRevisionOne.previousDraft,
  leadOneRevisionTwo.previousDraft,
  leadOneApproved,
  leadTwoDraft,
  leadThreeDraft,
];
