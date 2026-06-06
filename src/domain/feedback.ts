export type FeedbackCategory = 'ux' | 'bug' | 'result_quality' | 'other';
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative';

export type FeedbackInput = {
  leadId?: string;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  message: string;
  score?: number;
  source?: 'in_app' | 'email' | 'internal_note';
  metadata?: Record<string, unknown>;
};

export function normalizeFeedback(input: FeedbackInput) {
  const trimmed = input.message.trim();

  if (!trimmed) {
    throw new Error('Feedback message is required');
  }

  if (input.score !== undefined && (input.score < 1 || input.score > 5)) {
    throw new Error('Feedback score must be between 1 and 5');
  }

  return {
    leadId: input.leadId,
    category: input.category,
    sentiment: input.sentiment,
    source: input.source ?? 'in_app',
    score: input.score,
    message: trimmed,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    resolved: false,
  };
}
