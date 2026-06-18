import { describe, expect, it } from 'vitest';
import { demoFeedbackEntries } from '../data/demoFeedback';
import { feedbackNeedsAttention, normalizeFeedback, recentFeedback, summarizeFeedback } from '../domain/feedback';

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

  it('rejects non-integer or out-of-range score', () => {
    expect(() =>
      normalizeFeedback({
        category: 'result_quality',
        sentiment: 'negative',
        message: 'Bad draft quality',
        score: 2.5,
      })
    ).toThrow('Feedback score must be an integer between 1 and 5');

    expect(() =>
      normalizeFeedback({
        category: 'result_quality',
        sentiment: 'negative',
        message: 'Bad draft quality',
        score: 6,
      })
    ).toThrow('Feedback score must be an integer between 1 and 5');
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
      latestAt: '2026-06-10T07:32:00.000Z',
    });
  });

  it('orders recent feedback newest-first', () => {
    expect(recentFeedback(demoFeedbackEntries).map((entry) => entry.id)).toEqual([
      'feedback-demo-003',
      'feedback-demo-002',
      'feedback-demo-001',
    ]);
  });

  it('reports latestAt from the newest record even when input order drifts', () => {
    const outOfOrder = [demoFeedbackEntries[0], demoFeedbackEntries[2], demoFeedbackEntries[1]];

    expect(summarizeFeedback(outOfOrder)).toMatchObject({
      latestAt: '2026-06-10T07:32:00.000Z',
    });
  });

  it('prioritizes negative or low-score feedback for follow-up', () => {
    expect(feedbackNeedsAttention(demoFeedbackEntries).map((entry) => entry.id)).toEqual([
      'feedback-demo-003',
      'feedback-demo-001',
    ]);
  });
});
