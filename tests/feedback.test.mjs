import { describe, it, expect } from 'vitest';
import { normalizeFeedback } from '../lib/feedback.mjs';

describe('normalizeFeedback', () => {
  it('normalizes valid payload', () => {
    const out = normalizeFeedback({ rating: 5, comments: 'Great' });
    expect(out.rating).toBe(5);
    expect(out.channel).toBe('in_app');
  });

  it('trims optional text and nulls empty strings', () => {
    const out = normalizeFeedback({
      rating: 4,
      leadId: '  lead_123  ',
      category: '   ',
      comments: '  useful  ',
      channel: '  email  '
    });
    expect(out.leadId).toBe('lead_123');
    expect(out.category).toBe(null);
    expect(out.comments).toBe('useful');
    expect(out.channel).toBe('email');
  });

  it('throws for invalid rating', () => {
    expect(() => normalizeFeedback({ rating: 6 })).toThrow();
  });
});
