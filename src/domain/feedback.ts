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
  resolved?: boolean;
};

export function normalizeFeedback(input: FeedbackInput) {
  const trimmed = input.message.trim();

  if (!trimmed) {
    throw new Error('Feedback message is required');
  }

  if (
    input.score !== undefined &&
    (!Number.isInteger(input.score) || input.score < 1 || input.score > 5)
  ) {
    throw new Error('Feedback score must be an integer between 1 and 5');
  }

  return {
    leadId: input.leadId,
    category: input.category,
    sentiment: input.sentiment,
    source: input.source ?? 'in_app',
    score: input.score,
    message: trimmed,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    resolved: input.resolved ?? false,
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
  let latestAt: string | undefined;
  let latestTimestamp = Number.NEGATIVE_INFINITY;
  let resolvedCount = 0;

  for (const record of records) {
    categories[record.category] += 1;
    sentiments[record.sentiment] += 1;

    if (record.score !== undefined) {
      scoredCount += 1;
      scoredTotal += record.score;
    }

    if (record.resolved) {
      resolvedCount += 1;
    }

    const recordTimestamp = new Date(record.createdAt).getTime();
    if (Number.isFinite(recordTimestamp) && recordTimestamp > latestTimestamp) {
      latestTimestamp = recordTimestamp;
      latestAt = record.createdAt;
    }
  }

  return {
    total,
    categories,
    sentiments,
    averageScore: scoredCount ? Number((scoredTotal / scoredCount).toFixed(1)) : null,
    latestAt: latestAt ?? null,
    openCount: total - resolvedCount,
    resolvedCount,
  };
}

export function recentFeedback(records: FeedbackRecord[], limit = 3) {
  return [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export type FeedbackHotspot = {
  leadId: string;
  totalEntries: number;
  openEntries: number;
  negativeEntries: number;
  latestAt: string;
};

export type FeedbackEscalation = 'resolved' | 'fresh' | 'watch' | 'urgent';

export type FeedbackEscalationSummary = {
  urgent: number;
  watch: number;
  fresh: number;
  resolved: number;
  open: number;
  oldestOpenAt: string | null;
};

export function feedbackEscalation(record: FeedbackRecord, now = new Date()): FeedbackEscalation {
  if (record.resolved) {
    return 'resolved';
  }

  const ageHours = Math.max(0, (now.getTime() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60));
  const score = record.score ?? 5;

  if (record.sentiment === 'negative' || score <= 2) {
    return ageHours >= 24 ? 'urgent' : 'watch';
  }

  if (score <= 3 || record.category === 'bug' || record.category === 'result_quality') {
    return ageHours >= 72 ? 'urgent' : ageHours >= 24 ? 'watch' : 'fresh';
  }

  return ageHours >= 72 ? 'watch' : 'fresh';
}

export function summarizeFeedbackEscalations(records: FeedbackRecord[], now = new Date()): FeedbackEscalationSummary {
  const summary: FeedbackEscalationSummary = {
    urgent: 0,
    watch: 0,
    fresh: 0,
    resolved: 0,
    open: 0,
    oldestOpenAt: null,
  };

  let oldestOpenTimestamp = Number.POSITIVE_INFINITY;

  for (const record of records) {
    const escalation = feedbackEscalation(record, now);
    summary[escalation] += 1;

    if (!record.resolved) {
      summary.open += 1;
      const recordTimestamp = new Date(record.createdAt).getTime();
      if (Number.isFinite(recordTimestamp) && recordTimestamp < oldestOpenTimestamp) {
        oldestOpenTimestamp = recordTimestamp;
        summary.oldestOpenAt = record.createdAt;
      }
    }
  }

  return summary;
}

export function feedbackActionHint(record: FeedbackRecord, now = new Date()) {
  const escalation = feedbackEscalation(record, now);

  if (record.resolved) {
    return 'Resolved — no further follow-up needed unless new feedback arrives.';
  }

  if (record.category === 'bug') {
    return escalation === 'urgent'
      ? 'Overdue bug follow-up — reproduce the issue and confirm the fix with a human before the next demo.'
      : 'Check the linked workflow for a reproducible product bug before the next demo.';
  }

  if ((record.score ?? 5) <= 2 || record.sentiment === 'negative') {
    return escalation === 'urgent'
      ? 'Overdue reviewer concern — pause new outreach and resolve the linked draft or queue issue with a human first.'
      : 'Review the linked draft or queue state with a human before sending anything else.';
  }

  if (record.category === 'result_quality') {
    return escalation === 'urgent'
      ? 'Overdue copy fix — tighten the draft and re-check it with a human before the next follow-up.'
      : 'Tighten the draft copy and confirm the next version addresses the reviewer note.';
  }

  if (record.category === 'ux') {
    return escalation === 'urgent'
      ? 'Overdue UX follow-up — confirm the workflow is still obvious before another operator run.'
      : 'Verify the operator workflow stays obvious without adding automation risk.';
  }

  return escalation === 'urgent'
    ? 'Overdue review note — confirm context and close the loop manually before the next demo.'
    : 'Log the note, confirm the context, and decide the next manual-safe follow-up.';
}

export function feedbackHotspots(records: FeedbackRecord[], limit = 3): FeedbackHotspot[] {
  const grouped = new Map<string, FeedbackHotspot>();

  for (const record of records) {
    if (!record.leadId) {
      continue;
    }

    const existing = grouped.get(record.leadId) ?? {
      leadId: record.leadId,
      totalEntries: 0,
      openEntries: 0,
      negativeEntries: 0,
      latestAt: record.createdAt,
    };

    existing.totalEntries += 1;
    if (!record.resolved) {
      existing.openEntries += 1;
    }
    if (record.sentiment === 'negative') {
      existing.negativeEntries += 1;
    }
    if (new Date(record.createdAt).getTime() > new Date(existing.latestAt).getTime()) {
      existing.latestAt = record.createdAt;
    }

    grouped.set(record.leadId, existing);
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (b.openEntries !== a.openEntries) return b.openEntries - a.openEntries;
      if (b.negativeEntries !== a.negativeEntries) return b.negativeEntries - a.negativeEntries;
      if (b.totalEntries !== a.totalEntries) return b.totalEntries - a.totalEntries;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    })
    .slice(0, limit);
}

export function feedbackNeedsAttention(records: FeedbackRecord[]) {
  return [...records]
    .filter((record) => !record.resolved && (record.sentiment === 'negative' || (record.score ?? 5) <= 3))
    .sort((a, b) => {
      const escalationRank = { urgent: 0, watch: 1, fresh: 2, resolved: 3 } satisfies Record<FeedbackEscalation, number>;
      const escalationDelta = escalationRank[feedbackEscalation(a)] - escalationRank[feedbackEscalation(b)];
      if (escalationDelta !== 0) {
        return escalationDelta;
      }

      const scoreDelta = (a.score ?? 5) - (b.score ?? 5);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const sentimentRank = {
        negative: 0,
        neutral: 1,
        positive: 2,
      } satisfies Record<FeedbackSentiment, number>;
      const sentimentDelta = sentimentRank[a.sentiment] - sentimentRank[b.sentiment];
      if (sentimentDelta !== 0) {
        return sentimentDelta;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

