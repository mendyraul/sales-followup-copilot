import { describe, it, expect, beforeEach } from 'vitest';
import { captureFeedback, clearFeedbackStore, listFeedbackByLead } from '../domain/feedback';

describe('feedback capture', () => {
  beforeEach(() => clearFeedbackStore());

  it('captures feedback for a lead', () => {
    const item = captureFeedback({ leadId: 'lead-1', rating: 5, notes: 'Strong response' });
    expect(item.id).toBe('fb_1');
    expect(item.leadId).toBe('lead-1');
    expect(item.rating).toBe(5);

    const all = listFeedbackByLead('lead-1');
    expect(all).toHaveLength(1);
    expect(all[0].notes).toBe('Strong response');
  });

  it('rejects invalid rating', () => {
    expect(() => captureFeedback({ leadId: 'lead-2', rating: 0 })).toThrow(
      'rating must be an integer from 1 to 5'
    );
  });
});
