import { describe, expect, it } from 'vitest';
import { normalizeFeedback } from '../src/lib/feedback';

describe('normalizeFeedback', () => {
  it('normalizes valid feedback and trims comment', () => {
    const result = normalizeFeedback({ leadId: 'lead_1', rating: 5, comment: '  great draft  ' });
    expect(result).toMatchObject({ leadId: 'lead_1', rating: 5, comment: 'great draft', capturedBy: 'human' });
  });

  it('requires draftId or leadId', () => {
    expect(() => normalizeFeedback({ rating: 3 })).toThrow('Feedback requires draftId or leadId');
  });

  it('validates rating bounds', () => {
    expect(() => normalizeFeedback({ leadId: 'lead_1', rating: 0 })).toThrow('rating must be between 1 and 5');
    expect(() => normalizeFeedback({ leadId: 'lead_1', rating: 6 })).toThrow('rating must be between 1 and 5');
  });
});
