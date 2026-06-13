import { describe, expect, it } from 'vitest';
import { demoFeedbackEntries } from '../data/demoFeedback';
import { normalizeFeedback, recentFeedback, summarizeFeedback } from '../domain/feedback';

describe('feedback normalization', () => {
  it('trims message and defaults source', () => {
    const out = normalizeFeedback({
      category: 'ux',
      sentiment: 'neutral',
      message: '  Needs better copy on the queue card.  '
    });

    expect(out.message).toBe('Needs better copy on the queue card.');
    expect(out.source).toBe('in_app');
    expect(out.resolved).toBe(false);
  });

  it('rejects empty feedback', () => {
    expect(() =>
      normalizeFeedback({
        category: 'bug',
        sentiment: 'negative',
        message: '   '
      })
    ).toThrow('Feedback message is required');
  });

  it('rejects out-of-range score', () => {
    expect(() =>
      normalizeFeedback({
        category: 'result_quality',
        sentiment: 'negative',
        message: 'Bad draft quality',
        score: 6,
      })
    ).toThrow('Feedback score must be between 1 and 5');
  });

  it('summarizes seeded feedback for operator review', () => {
    expect(summarizeFeedback(demoFeedbackEntries)).toEqual({
      total: 3,
      categories: {
        ux: 1,
        bug: 1,
        result_quality: 1,
        other: 0,
      },
      sentiments: {
        positive: 1,
        neutral: 1,
        negative: 1,
      },
      averageScore: 3.3,
      latestAt: '2026-06-10T07:08:00.000Z',
    });
  });

  it('orders recent feedback newest-first', () => {
    expect(recentFeedback(demoFeedbackEntries).map((entry) => entry.id)).toEqual([
      'feedback-demo-003',
      'feedback-demo-002',
      'feedback-demo-001',
    ]);
  });
});
