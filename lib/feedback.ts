export type FeedbackCategory = 'ux' | 'quality' | 'bug' | 'other'

export interface FeedbackInput {
  leadId?: string | null
  rating: number
  category?: string | null
  comments?: string | null
  channel?: string | null
  metadata?: Record<string, unknown> | null
}

export interface NormalizedFeedback {
  leadId: string | null
  rating: number
  category: FeedbackCategory | null
  comments: string | null
  channel: string
  metadata: Record<string, unknown> | null
}

const FEEDBACK_CATEGORIES = new Set<FeedbackCategory>(['ux', 'quality', 'bug', 'other'])

function optionalText(value?: string | null): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

export function normalizeFeedback(
  input: FeedbackInput,
  fallbackChannel = process.env.FEEDBACK_DEFAULT_CHANNEL ?? 'in_app'
): NormalizedFeedback {
  const rating = Number(input.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating must be an integer from 1 to 5')
  }

  const channel = optionalText(input.channel) ?? optionalText(fallbackChannel) ?? 'in_app'
  const categoryText = optionalText(input.category)?.toLowerCase() ?? null
  if (categoryText && !FEEDBACK_CATEGORIES.has(categoryText as FeedbackCategory)) {
    throw new Error('category must be one of ux, quality, bug, or other')
  }

  const metadata =
    input.metadata == null
      ? null
      : typeof input.metadata === 'object' && !Array.isArray(input.metadata)
        ? input.metadata
        : null

  return {
    leadId: optionalText(input.leadId),
    rating,
    category: (categoryText as FeedbackCategory | null) ?? null,
    comments: optionalText(input.comments),
    channel,
    metadata,
  }
}
