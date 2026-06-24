export type ManualQaStatus = 'ready' | 'watch';

export type ManualQaChecklistItem = {
  id: string;
  area: string;
  title: string;
  status: ManualQaStatus;
  whyItMatters: string;
  verification: string;
};

export const demoManualQaChecklist: ManualQaChecklistItem[] = [
  {
    id: 'manual-qa-001',
    area: 'startup',
    title: 'Boot the app in manual mode',
    status: 'ready',
    whyItMatters: 'Confirms the local demo opens without enabling live sending.',
    verification: "Run `npm run dev`, open `/`, and confirm the Safety mode card shows `manual`.",
  },
  {
    id: 'manual-qa-002',
    area: 'queue',
    title: 'Verify the next-action queue stays prioritized',
    status: 'ready',
    whyItMatters: 'Operators need the hottest or stalest leads surfaced first.',
    verification: "Confirm the queue ordering still starts with `Pat Rivera`, then `Jordan Lee`, then `Avery Smith`.",
  },
  {
    id: 'manual-qa-003',
    area: 'timeline',
    title: 'Check lead notes and newest-first timeline history',
    status: 'ready',
    whyItMatters: 'Reviewers need visible context before approving follow-up drafts.',
    verification: "Open the Lead timeline section and confirm each lead card shows a latest note plus the newest timeline events first.",
  },
  {
    id: 'manual-qa-004',
    area: 'import',
    title: 'Review CSV preview warnings before import',
    status: 'ready',
    whyItMatters: 'Bulk lead uploads should fail loudly on bad rows instead of polluting the database.',
    verification: "Confirm the CSV preview reports 4 valid rows, 1 blocked row, and a duplicate warning for `jordan@example.com`.",
  },
  {
    id: 'manual-qa-005',
    area: 'outbound',
    title: 'Keep outbound delivery blocked during QA',
    status: 'watch',
    whyItMatters: 'Manual review is the product boundary; QA should not accidentally send real messages.',
    verification: "Check `.env` / docs and confirm `SEND_MODE=manual` remains the default unless a reviewer intentionally changes it.",
  },
];
