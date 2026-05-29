export type FeedbackType = 'positive' | 'neutral' | 'negative'

export interface FeedbackInput {
  leadId: string
  messageId: string
  type: FeedbackType
  notes?: string
}

export interface CapturedFeedback extends FeedbackInput {
  id: string
  createdAt: Date
}

function ensureNonEmpty(value: string, field: string): string {
  const v = value.trim()
  if (!v) throw new Error(`${field} is required`)
  return v
}

export function captureFeedback(input: FeedbackInput, now = new Date()): CapturedFeedback {
  const leadId = ensureNonEmpty(input.leadId, 'leadId')
  const messageId = ensureNonEmpty(input.messageId, 'messageId')
  const notes = input.notes?.trim()

  return {
    id: `${leadId}:${messageId}:${now.getTime()}`,
    leadId,
    messageId,
    type: input.type,
    notes,
    createdAt: now,
  }
}
