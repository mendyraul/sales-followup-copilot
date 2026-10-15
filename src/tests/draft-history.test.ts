import { describe, expect, it } from 'vitest';
import {
  createDraft,
  currentDraftRevision,
  draftHistory,
  type FollowUpDraftRecord,
} from '../../lib/draftWorkflow';
import { demoDraftHistory } from '../data/demoDraftHistory';
import { buildDraftThreads, summarizeDraftHistory } from '../domain/draft-history';

describe('draft history helpers', () => {
  it('builds newest-first draft threads with visible revision lineage', () => {
    const threads = buildDraftThreads(demoDraftHistory);

    expect(threads).toHaveLength(3);
    expect(threads[0]?.current.id).toBe('draft-demo-001-v2-v3');
    expect(threads[0]?.history.map((revision) => revision.id)).toEqual([
      'draft-demo-001',
      'draft-demo-001-v2',
    ]);
    expect(threads[0]?.latestDecision).toBe('approve');
    expect(threads[1]?.current.status).toBe('pending');
    expect(threads[2]?.current.status).toBe('rejected');
  });

  it('summarizes revision coverage across pending, approved, and rejected threads', () => {
    expect(summarizeDraftHistory(demoDraftHistory)).toEqual({
      totalThreads: 3,
      totalRevisions: 5,
      revisedThreads: 1,
      pendingThreads: 1,
      approvedThreads: 1,
      rejectedThreads: 1,
      latestUpdatedAt: '2026-06-10T07:28:00.000Z',
    });
  });

  it('stops following malformed supersession cycles instead of looping forever', () => {
    const first = createDraft({
      id: 'draft-cycle-001',
      leadId: 'lead-cycle-001',
      stage: 'drafted',
      content: 'Initial draft copy.',
      now: new Date('2026-06-10T08:00:00.000Z'),
    });

    const second: FollowUpDraftRecord = {
      ...first,
      id: 'draft-cycle-001-v2',
      version: 2,
      content: 'Revised draft copy.',
      createdAt: new Date('2026-06-10T08:05:00.000Z'),
      updatedAt: new Date('2026-06-10T08:05:00.000Z'),
      supersedesId: first.id,
    };

    const malformedRecords: FollowUpDraftRecord[] = [
      {
        ...first,
        supersededById: second.id,
        supersedesId: second.id,
      },
      {
        ...second,
        supersededById: first.id,
      },
    ];

    expect(currentDraftRevision(malformedRecords, first.id)?.id).toBe(second.id);
    expect(currentDraftRevision(malformedRecords, second.id)?.id).toBe(first.id);
    expect(draftHistory(malformedRecords, first.id).map((revision) => revision.id)).toEqual([second.id]);
    expect(draftHistory(malformedRecords, second.id).map((revision) => revision.id)).toEqual([first.id]);
  });
});
