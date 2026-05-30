import { beforeEach, describe, expect, it } from 'vitest';
import { captureFeedback, clearFeedbackStore, listFeedback } from './feedbackCapture';

describe('feedbackCapture', () => {
  beforeEach(() => {
    clearFeedbackStore();
  });

  it('captures validated feedback records', () => {
    const record = captureFeedback({
      leadEmail: ' Prospect@Example.com ',
      rating: 5,
      comment: '  Super helpful follow-up flow.  ',
      channel: 'email'
    });

    expect(record.leadEmail).toBe('prospect@example.com');
    expect(record.rating).toBe(5);
    expect(record.comment).toBe('Super helpful follow-up flow.');
    expect(record.id.startsWith('fb_')).toBe(true);
    expect(listFeedback()).toHaveLength(1);
  });

  it('rejects invalid rating, email, channel, or submittedAt', () => {
    expect(() =>
      captureFeedback({ leadEmail: 'bad-email', rating: 5, channel: 'sms' })
    ).toThrow(/valid email/i);

    expect(() =>
      captureFeedback({ leadEmail: 'ok@example.com', rating: 7, channel: 'sms' })
    ).toThrow(/between 1 and 5/i);

    expect(() =>
      captureFeedback({ leadEmail: 'ok@example.com', rating: 4, channel: 'fax' as any })
    ).toThrow(/channel must be one of/i);

    expect(() =>
      captureFeedback({
        leadEmail: 'ok@example.com',
        rating: 4,
        channel: 'sms',
        submittedAt: 'not-a-date'
      })
    ).toThrow(/valid ISO timestamp/i);
  });



  it('truncates comments beyond 500 chars', () => {
    const longComment = 'x'.repeat(700);
    const record = captureFeedback({
      leadEmail: 'trim@example.com',
      rating: 4,
      comment: longComment,
      channel: 'in-app'
    });

    expect(record.comment).not.toBeNull();
    expect(record.comment?.length).toBe(500);
  });

  it('uses provided submittedAt timestamp when present', () => {
    const submittedAt = '2026-05-30T15:00:00.000Z';
    const record = captureFeedback({
      leadEmail: 'time@example.com',
      rating: 4,
      channel: 'sms',
      submittedAt
    });

    expect(record.submittedAt).toBe(submittedAt);
  });

  it('stores null when optional comment is empty', () => {
    const record = captureFeedback({
      leadEmail: 'ok@example.com',
      rating: 3,
      comment: '   ',
      channel: 'call'
    });

    expect(record.comment).toBeNull();
  });
});
