import { type FeedbackInput, normalizeFeedback } from '../domain/feedback';

export type DemoFeedbackEntry = ReturnType<typeof normalizeFeedback> & {
  id: string;
  createdAt: string;
  reviewer: string;
};

const seededFeedback: Array<FeedbackInput & { id: string; createdAt: string; reviewer: string }> = [
  {
    id: 'feedback-demo-001',
    leadId: 'lead-demo-003',
    category: 'result_quality',
    sentiment: 'neutral',
    message: 'Opening line feels a little long; keep the ask but shorten the first sentence.',
    score: 3,
    source: 'in_app',
    metadata: { draftId: 'draft-demo-001', action: 'edit-request' },
    reviewer: 'qa-reviewer',
    createdAt: '2026-06-10T07:08:00.000Z',
  },
  {
    id: 'feedback-demo-002',
    leadId: 'lead-demo-002',
    category: 'ux',
    sentiment: 'positive',
    message: 'Queue card made the next step obvious; keep the priority reason visible.',
    score: 5,
    source: 'internal_note',
    metadata: { area: 'queue-ui' },
    resolved: true,
    reviewer: 'ops-demo',
    createdAt: '2026-06-10T07:20:00.000Z',
  },
  {
    id: 'feedback-demo-003',
    leadId: 'lead-demo-001',
    category: 'bug',
    sentiment: 'negative',
    message: 'CSV preview should call out when a duplicate email row would overwrite an existing lead.',
    score: 2,
    source: 'email',
    metadata: { area: 'csv-import' },
    reviewer: 'pilot-owner',
    createdAt: '2026-06-10T07:32:00.000Z',
  },
];

export const demoFeedbackEntries: DemoFeedbackEntry[] = seededFeedback.map(({ id, createdAt, reviewer, ...input }) => ({
  id,
  createdAt,
  reviewer,
  ...normalizeFeedback(input),
}));
