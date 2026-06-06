import { describe, expect, it } from 'vitest';
import { normalizeFeedback } from '../domain/feedback';

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
});
