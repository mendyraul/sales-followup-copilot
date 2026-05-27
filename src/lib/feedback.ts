export type FeedbackCategory =
  | 'message_quality'
  | 'timing'
  | 'relevance'
  | 'outcome'
  | 'other';

export interface FeedbackInput {
  draftId?: string;
  leadId?: string;
  rating?: number;
  category?: FeedbackCategory;
  comment?: string;
  capturedBy?: string;
}

export interface NormalizedFeedback {
  draftId: string | null;
  leadId: string | null;
  rating: number | null;
  category: FeedbackCategory | null;
  comment: string | null;
  capturedBy: string;
}

export function normalizeFeedback(input: FeedbackInput): NormalizedFeedback {
  if (!input.draftId && !input.leadId) {
    throw new Error('Feedback requires draftId or leadId');
  }

  if (input.rating != null && (input.rating < 1 || input.rating > 5)) {
    throw new Error('rating must be between 1 and 5');
  }

  const trimmedComment = input.comment?.trim();

  return {
    draftId: input.draftId ?? null,
    leadId: input.leadId ?? null,
    rating: input.rating ?? null,
    category: input.category ?? null,
    comment: trimmedComment ? trimmedComment.slice(0, 1000) : null,
    capturedBy: input.capturedBy?.trim() || 'human',
  };
}
