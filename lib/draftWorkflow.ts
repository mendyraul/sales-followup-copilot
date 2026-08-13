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
  supersedesId?: string
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
    supersedesId: draft.id,
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


export function draftHistory(records: FollowUpDraftRecord[], draftId: string): FollowUpDraftRecord[] {
  const byId = new Map(records.map((record) => [record.id, record]))
  const current = byId.get(draftId)

  if (!current) {
    return []
  }

  const history: FollowUpDraftRecord[] = []
  const visited = new Set<string>([draftId])
  let cursor: FollowUpDraftRecord | undefined = current

  while (cursor?.supersedesId) {
    if (visited.has(cursor.supersedesId)) {
      break
    }

    const previous = byId.get(cursor.supersedesId)
    if (!previous || visited.has(previous.id)) {
      break
    }
    visited.add(previous.id)
    history.push(previous)
    cursor = previous
  }

  return history.reverse()
}

export function currentDraftRevision(records: FollowUpDraftRecord[], draftId: string): FollowUpDraftRecord | undefined {
  const byId = new Map(records.map((record) => [record.id, record]))
  let cursor = byId.get(draftId)
  const visited = new Set<string>()

  while (cursor) {
    if (visited.has(cursor.id)) {
      break
    }

    visited.add(cursor.id)

    if (!cursor.supersededById) {
      break
    }

    if (visited.has(cursor.supersededById)) {
      break
    }

    const next = byId.get(cursor.supersededById)
    if (!next || visited.has(cursor.id) || visited.has(next.id)) {
      break
    }
    visited.add(cursor.id)
    cursor = next
  }

  return cursor
}
