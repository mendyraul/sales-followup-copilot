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

export type FeedbackRecord = ReturnType<typeof normalizeFeedback> & {
  id: string;
  createdAt: string;
  reviewer: string;
};

export function summarizeFeedback(records: FeedbackRecord[]) {
  const total = records.length;
  const categories = {
    ux: 0,
    bug: 0,
    result_quality: 0,
    other: 0,
  } satisfies Record<FeedbackCategory, number>;
  const sentiments = {
    positive: 0,
    neutral: 0,
    negative: 0,
  } satisfies Record<FeedbackSentiment, number>;

  let scoredCount = 0;
  let scoredTotal = 0;

  for (const record of records) {
    categories[record.category] += 1;
    sentiments[record.sentiment] += 1;

    if (record.score !== undefined) {
      scoredCount += 1;
      scoredTotal += record.score;
    }
  }

  return {
    total,
    categories,
    sentiments,
    averageScore: scoredCount ? Number((scoredTotal / scoredCount).toFixed(1)) : null,
    latestAt: records[0]?.createdAt,
  };
}

export function recentFeedback(records: FeedbackRecord[], limit = 3) {
  return [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

