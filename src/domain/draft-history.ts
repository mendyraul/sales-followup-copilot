import {
  currentDraftRevision,
  draftHistory,
  type DraftDecision,
  type DraftReviewStatus,
  type FollowUpDraftRecord,
} from '../../lib/draftWorkflow';

export interface DraftThread {
  current: FollowUpDraftRecord;
  history: FollowUpDraftRecord[];
  latestDecision?: DraftDecision;
  latestActor?: string;
}

export interface DraftHistorySummary {
  totalThreads: number;
  totalRevisions: number;
  revisedThreads: number;
  pendingThreads: number;
  approvedThreads: number;
  rejectedThreads: number;
  latestUpdatedAt?: string;
}

function byNewestUpdate(a: FollowUpDraftRecord, b: FollowUpDraftRecord) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function countByStatus(records: FollowUpDraftRecord[], status: DraftReviewStatus) {
  return records.filter((record) => record.status === status).length;
}

export function buildDraftThreads(records: FollowUpDraftRecord[]): DraftThread[] {
  const currentRecords = records
    .filter((record) => !record.supersededById)
    .map((record) => currentDraftRevision(records, record.id) ?? record)
    .sort(byNewestUpdate);

  return currentRecords.map((current) => {
    const history = draftHistory(records, current.id);
    const latestReview = current.reviewLog[current.reviewLog.length - 1];

    return {
      current,
      history,
      latestDecision: latestReview?.decision,
      latestActor: latestReview?.actor,
    };
  });
}

export function summarizeDraftHistory(records: FollowUpDraftRecord[]): DraftHistorySummary {
  const threads = buildDraftThreads(records);
  const sortedUpdatedAt = records.map((record) => record.updatedAt.toISOString()).sort();
  const latestUpdatedAt = sortedUpdatedAt[sortedUpdatedAt.length - 1];

  return {
    totalThreads: threads.length,
    totalRevisions: records.length,
    revisedThreads: threads.filter((thread) => thread.history.length > 0).length,
    pendingThreads: countByStatus(threads.map((thread) => thread.current), 'pending'),
    approvedThreads: countByStatus(threads.map((thread) => thread.current), 'approved'),
    rejectedThreads: countByStatus(threads.map((thread) => thread.current), 'rejected'),
    latestUpdatedAt,
  };
}
