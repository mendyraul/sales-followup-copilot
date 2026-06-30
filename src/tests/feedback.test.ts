import { describe, expect, it } from 'vitest';
import { demoFeedbackEntries } from '../data/demoFeedback';
import { feedbackActionHint, feedbackEscalation, feedbackHotspots, feedbackNeedsAttention, normalizeFeedback, recentFeedback, summarizeFeedback, summarizeFeedbackEscalations } from '../domain/feedback';

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
      openCount: 2,
      resolvedCount: 1,
    });
  });

  it('orders recent feedback newest-first', () => {
    expect(recentFeedback(demoFeedbackEntries).map((entry) => entry.id)).toEqual([
      'feedback-demo-003',
      'feedback-demo-002',
      'feedback-demo-001',
    ]);
  });

  it('preserves explicit resolved state from captured feedback', () => {
    const resolved = normalizeFeedback({
      category: 'ux',
      sentiment: 'positive',
      message: 'Fixed after QA review',
      resolved: true,
    });

    expect(resolved.resolved).toBe(true);
  });

  it('reports latestAt from the newest record even when input order drifts', () => {
    const outOfOrder = [demoFeedbackEntries[0], demoFeedbackEntries[2], demoFeedbackEntries[1]];

    expect(summarizeFeedback(outOfOrder)).toMatchObject({
      latestAt: '2026-06-10T07:32:00.000Z',
    });
  });

  it('prioritizes only unresolved negative or low-score feedback for follow-up', () => {
    expect(feedbackNeedsAttention(demoFeedbackEntries).map((entry) => entry.id)).toEqual([
      'feedback-demo-003',
      'feedback-demo-001',
    ]);
  });

  it('orders follow-up feedback by escalation, severity, sentiment, and recency', () => {
    const ordered = feedbackNeedsAttention([
      {
        id: 'fresh-low-score',
        leadId: 'lead-1',
        category: 'result_quality',
        sentiment: 'neutral',
        source: 'in_app',
        score: 3,
        message: 'Needs a tighter CTA',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T11:00:00.000Z',
      },
      {
        id: 'watch-negative',
        leadId: 'lead-2',
        category: 'ux',
        sentiment: 'negative',
        source: 'in_app',
        score: 4,
        message: 'Queue card is still confusing',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T11:30:00.000Z',
      },
      {
        id: 'watch-low-score',
        leadId: 'lead-3',
        category: 'result_quality',
        sentiment: 'neutral',
        source: 'in_app',
        score: 2,
        message: 'Draft quality still needs work',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T11:45:00.000Z',
      },
      {
        id: 'fresh-negative-newer',
        leadId: 'lead-4',
        category: 'ux',
        sentiment: 'negative',
        source: 'in_app',
        score: 5,
        message: 'Still too many clicks',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T11:59:00.000Z',
      },
      {
        id: 'fresh-negative-older',
        leadId: 'lead-5',
        category: 'ux',
        sentiment: 'negative',
        source: 'in_app',
        score: 5,
        message: 'The note form still feels buried',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T11:15:00.000Z',
      },
    ], new Date('2026-06-10T12:00:00.000Z'));

    expect(ordered.map((entry) => entry.id)).toEqual([
      'watch-low-score',
      'watch-negative',
      'fresh-negative-newer',
      'fresh-negative-older',
      'fresh-low-score',
    ]);
  });

  it('uses an injected clock for follow-up escalation ordering', () => {
    const records = [
      {
        id: 'feedback-quality',
        leadId: 'lead-demo-001',
        category: 'result_quality' as const,
        sentiment: 'neutral' as const,
        source: 'in_app' as const,
        score: 3,
        message: 'Needs a tighter opener.',
        metadata: undefined,
        resolved: false,
        reviewer: 'qa@demo.test',
        createdAt: '2026-06-10T00:00:00.000Z',
      },
      {
        id: 'feedback-negative',
        leadId: 'lead-demo-002',
        category: 'ux' as const,
        sentiment: 'negative' as const,
        source: 'in_app' as const,
        score: 4,
        message: 'Queue review flow still feels awkward.',
        metadata: undefined,
        resolved: false,
        reviewer: 'qa@demo.test',
        createdAt: '2026-06-11T00:00:00.000Z',
      },
    ];

    expect(
      feedbackNeedsAttention(records, new Date('2026-06-11T12:00:00.000Z')).map((entry) => entry.id)
    ).toEqual(['feedback-quality', 'feedback-negative']);

    expect(
      feedbackNeedsAttention(records, new Date('2026-06-12T12:30:00.000Z')).map((entry) => entry.id)
    ).toEqual(['feedback-negative', 'feedback-quality']);
  });

  it('surfaces repeat feedback hotspots by linked lead', () => {
    expect(feedbackHotspots(demoFeedbackEntries)).toEqual([
      {
        leadId: 'lead-demo-001',
        totalEntries: 1,
        openEntries: 1,
        negativeEntries: 1,
        latestAt: '2026-06-10T07:32:00.000Z',
      },
      {
        leadId: 'lead-demo-003',
        totalEntries: 1,
        openEntries: 1,
        negativeEntries: 0,
        latestAt: '2026-06-10T07:08:00.000Z',
      },
      {
        leadId: 'lead-demo-002',
        totalEntries: 1,
        openEntries: 0,
        negativeEntries: 0,
        latestAt: '2026-06-10T07:20:00.000Z',
      },
    ]);
  });

  it('skips unlinked feedback and keeps hotspot ordering stable across tie-breakers', () => {
    const hotspots = feedbackHotspots([
      {
        id: 'feedback-1',
        leadId: 'lead-a',
        category: 'bug',
        sentiment: 'negative',
        source: 'in_app',
        score: 2,
        message: 'Bug report',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T09:00:00.000Z',
      },
      {
        id: 'feedback-2',
        leadId: 'lead-a',
        category: 'ux',
        sentiment: 'neutral',
        source: 'in_app',
        score: 3,
        message: 'UX note',
        metadata: undefined,
        resolved: true,
        reviewer: 'Rico',
        createdAt: '2026-06-10T10:00:00.000Z',
      },
      {
        id: 'feedback-3',
        leadId: 'lead-b',
        category: 'result_quality',
        sentiment: 'negative',
        source: 'in_app',
        score: 2,
        message: 'Copy issue',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T11:00:00.000Z',
      },
      {
        id: 'feedback-4',
        leadId: 'lead-b',
        category: 'bug',
        sentiment: 'negative',
        source: 'in_app',
        score: 1,
        message: 'Another bug',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T12:00:00.000Z',
      },
      {
        id: 'feedback-5',
        leadId: undefined,
        category: 'other',
        sentiment: 'negative',
        source: 'internal_note',
        score: 2,
        message: 'General note without a lead',
        metadata: undefined,
        resolved: false,
        reviewer: 'Rico',
        createdAt: '2026-06-10T13:00:00.000Z',
      },
    ]);

    expect(hotspots).toEqual([
      {
        leadId: 'lead-b',
        totalEntries: 2,
        openEntries: 2,
        negativeEntries: 2,
        latestAt: '2026-06-10T12:00:00.000Z',
      },
      {
        leadId: 'lead-a',
        totalEntries: 2,
        openEntries: 1,
        negativeEntries: 1,
        latestAt: '2026-06-10T10:00:00.000Z',
      },
    ]);
  });

  it('skips resolved low-score feedback in the follow-up queue', () => {
    const resolvedLowScore = demoFeedbackEntries.map((entry) =>
      entry.id === 'feedback-demo-001' ? { ...entry, resolved: true } : entry
    );

    expect(feedbackNeedsAttention(resolvedLowScore).map((entry) => entry.id)).toEqual(['feedback-demo-003']);
  });


  it('marks unresolved aged feedback as urgent escalation', () => {
    expect(feedbackEscalation(demoFeedbackEntries[2], new Date('2026-06-12T08:00:00.000Z'))).toBe('urgent');
    expect(feedbackEscalation(demoFeedbackEntries[0], new Date('2026-06-10T08:00:00.000Z'))).toBe('fresh');
    expect(feedbackEscalation({ ...demoFeedbackEntries[1], resolved: true }, new Date('2026-06-12T08:00:00.000Z'))).toBe('resolved');
  });

  it('generates manual-safe action hints for open and resolved feedback', () => {
    expect(feedbackActionHint(demoFeedbackEntries[2], new Date('2026-06-12T08:00:00.000Z'))).toContain('Overdue bug follow-up');
    expect(feedbackActionHint({ ...demoFeedbackEntries[1], resolved: true })).toContain('Resolved');
  });

  it('keeps operator feedback action hints stable across categories and urgency states', () => {
    const freshNow = new Date('2026-06-10T12:00:00.000Z');
    const urgentNow = new Date('2026-06-14T12:00:00.000Z');

    expect(
      feedbackActionHint(
        {
          id: 'negative-fresh',
          leadId: 'lead-1',
          category: 'other',
          sentiment: 'negative',
          source: 'in_app',
          score: 4,
          message: 'Need a human review before another send.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T11:00:00.000Z',
        },
        freshNow
      )
    ).toBe('Review the linked draft or queue state with a human before sending anything else.');

    expect(
      feedbackActionHint(
        {
          id: 'negative-urgent',
          leadId: 'lead-2',
          category: 'other',
          sentiment: 'negative',
          source: 'in_app',
          score: 4,
          message: 'Still blocked on a human check.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T11:00:00.000Z',
        },
        urgentNow
      )
    ).toBe(
      'Overdue reviewer concern — pause new outreach and resolve the linked draft or queue issue with a human first.'
    );

    expect(
      feedbackActionHint(
        {
          id: 'quality-fresh',
          leadId: 'lead-3',
          category: 'result_quality',
          sentiment: 'neutral',
          source: 'in_app',
          score: 4,
          message: 'Tighten the opener.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T10:00:00.000Z',
        },
        freshNow
      )
    ).toBe('Tighten the draft copy and confirm the next version addresses the reviewer note.');

    expect(
      feedbackActionHint(
        {
          id: 'quality-urgent',
          leadId: 'lead-4',
          category: 'result_quality',
          sentiment: 'neutral',
          source: 'in_app',
          score: 4,
          message: 'Copy still needs work.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T10:00:00.000Z',
        },
        urgentNow
      )
    ).toBe('Overdue copy fix — tighten the draft and re-check it with a human before the next follow-up.');

    expect(
      feedbackActionHint(
        {
          id: 'ux-fresh',
          leadId: 'lead-5',
          category: 'ux',
          sentiment: 'neutral',
          source: 'in_app',
          score: 4,
          message: 'Queue card is a little busy.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T09:00:00.000Z',
        },
        freshNow
      )
    ).toBe('Verify the operator workflow stays obvious without adding automation risk.');

    expect(
      feedbackActionHint(
        {
          id: 'ux-urgent',
          leadId: 'lead-6',
          category: 'ux',
          sentiment: 'neutral',
          source: 'in_app',
          score: 4,
          message: 'The workflow still feels hidden.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T09:00:00.000Z',
        },
        urgentNow
      )
    ).toBe('Verify the operator workflow stays obvious without adding automation risk.');

    expect(
      feedbackActionHint(
        {
          id: 'general-fresh',
          leadId: 'lead-7',
          category: 'other',
          sentiment: 'neutral',
          source: 'in_app',
          score: 5,
          message: 'General note for later.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T08:00:00.000Z',
        },
        freshNow
      )
    ).toBe('Log the note, confirm the context, and decide the next manual-safe follow-up.');

    expect(
      feedbackActionHint(
        {
          id: 'general-urgent',
          leadId: 'lead-8',
          category: 'other',
          sentiment: 'neutral',
          source: 'in_app',
          score: 5,
          message: 'Older general note.',
          metadata: undefined,
          resolved: false,
          reviewer: 'Rico',
          createdAt: '2026-06-10T08:00:00.000Z',
        },
        urgentNow
      )
    ).toBe('Log the note, confirm the context, and decide the next manual-safe follow-up.');
  });

  it('summarizes escalation buckets and oldest open feedback', () => {
    expect(summarizeFeedbackEscalations(demoFeedbackEntries, new Date('2026-06-12T08:00:00.000Z'))).toEqual({
      urgent: 1,
      watch: 1,
      fresh: 0,
      resolved: 1,
      open: 2,
      oldestOpenAt: '2026-06-10T07:08:00.000Z',
    });
  });
});
