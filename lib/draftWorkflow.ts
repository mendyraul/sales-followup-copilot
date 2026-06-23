import { getSendMode, type SendMode } from './runtimeMode'

export type DraftReviewStatus = 'pending' | 'approved' | 'rejected'
export type DraftDecision = 'approve' | 'edit' | 'reject'

export interface DraftReviewEntry {
  id: string
  decision: DraftDecision
  actor: string
  createdAt: Date
  notes?: string
  nextDraftId?: string
}

export interface FollowUpDraftRecord {
  id: string
  leadId: string
  stage: string
  content: string
  version: number
  status: DraftReviewStatus
  mode: SendMode
  createdAt: Date
  updatedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
  supersededById?: string
  reviewLog: DraftReviewEntry[]
}

export interface CreateDraftInput {
  id: string
  leadId: string
  stage: string
  content: string
  mode?: string | null
  now?: Date
}

export interface ReviewDraftInput {
  actor: string
  notes?: string
  now?: Date
}

export interface EditDraftInput extends ReviewDraftInput {
  content: string
}

function ensureNonEmpty(value: string, field: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${field} is required`)
  return trimmed
}

function nextTimestamp(now?: Date): Date {
  return now ? new Date(now) : new Date()
}

function buildReviewId(draftId: string, decision: DraftDecision, at: Date): string {
  return `${draftId}:${decision}:${at.getTime()}`
}

export function createDraft(input: CreateDraftInput): FollowUpDraftRecord {
  const at = nextTimestamp(input.now)
  const mode = getSendMode(input.mode ?? undefined)

  return {
    id: ensureNonEmpty(input.id, 'id'),
    leadId: ensureNonEmpty(input.leadId, 'leadId'),
    stage: ensureNonEmpty(input.stage, 'stage'),
    content: ensureNonEmpty(input.content, 'content'),
    version: 1,
    status: 'pending',
    mode,
    createdAt: at,
    updatedAt: at,
    reviewLog: [],
  }
}

export function approveDraft(draft: FollowUpDraftRecord, input: ReviewDraftInput): FollowUpDraftRecord {
  if (draft.status !== 'pending') {
    throw new Error(`only pending drafts can be approved (received ${draft.status})`)
  }

  const at = nextTimestamp(input.now)
  return {
    ...draft,
    status: 'approved',
    updatedAt: at,
    approvedAt: at,
    reviewLog: [
      ...draft.reviewLog,
      {
        id: buildReviewId(draft.id, 'approve', at),
        decision: 'approve',
        actor: ensureNonEmpty(input.actor, 'actor'),
        notes: input.notes?.trim() || undefined,
        createdAt: at,
      },
    ],
  }
}

export function rejectDraft(draft: FollowUpDraftRecord, input: ReviewDraftInput): FollowUpDraftRecord {
  if (draft.status !== 'pending') {
    throw new Error(`only pending drafts can be rejected (received ${draft.status})`)
  }

  const at = nextTimestamp(input.now)
  const reason = ensureNonEmpty(input.notes ?? '', 'notes')
  return {
    ...draft,
    status: 'rejected',
    updatedAt: at,
    rejectedAt: at,
    rejectionReason: reason,
    reviewLog: [
      ...draft.reviewLog,
      {
        id: buildReviewId(draft.id, 'reject', at),
        decision: 'reject',
        actor: ensureNonEmpty(input.actor, 'actor'),
        notes: reason,
        createdAt: at,
      },
    ],
  }
}

export function editDraft(
  draft: FollowUpDraftRecord,
  input: EditDraftInput,
): { previousDraft: FollowUpDraftRecord; nextDraft: FollowUpDraftRecord } {
  if (draft.status !== 'pending') {
    throw new Error(`only pending drafts can be edited (received ${draft.status})`)
  }

  const at = nextTimestamp(input.now)
  const actor = ensureNonEmpty(input.actor, 'actor')
  const content = ensureNonEmpty(input.content, 'content')
  const nextDraftId = `${draft.id}-v${draft.version + 1}`

  const previousDraft: FollowUpDraftRecord = {
    ...draft,
    updatedAt: at,
    supersededById: nextDraftId,
    reviewLog: [
      ...draft.reviewLog,
      {
        id: buildReviewId(draft.id, 'edit', at),
        decision: 'edit',
        actor,
        notes: input.notes?.trim() || undefined,
        nextDraftId,
        createdAt: at,
      },
    ],
  }

  const nextDraft: FollowUpDraftRecord = {
    ...draft,
    id: nextDraftId,
    content,
    version: draft.version + 1,
    status: 'pending',
    createdAt: at,
    updatedAt: at,
    approvedAt: undefined,
    rejectedAt: undefined,
    rejectionReason: undefined,
    supersededById: undefined,
    reviewLog: [
      {
        id: buildReviewId(nextDraftId, 'edit', at),
        decision: 'edit',
        actor,
        notes: input.notes?.trim() || undefined,
        createdAt: at,
      },
    ],
  }

  return { previousDraft, nextDraft }
}
