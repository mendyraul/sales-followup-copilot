import { describe, it, expect } from 'vitest';
import { normalizeFeedback } from '../lib/feedback.mjs';

describe('normalizeFeedback', () => {
  it('normalizes valid payload', () => {
    const out = normalizeFeedback({ rating: 5, comments: 'Great' });
    expect(out.rating).toBe(5);
    expect(out.channel).toBe('in_app');
  });

  it('throws for invalid rating', () => {
    expect(() => normalizeFeedback({ rating: 6 })).toThrow();
  });
});
