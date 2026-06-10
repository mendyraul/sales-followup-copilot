import { describe, expect, it } from 'vitest'
import { approveDraft, createDraft, editDraft, rejectDraft } from './draftWorkflow'

describe('draft review workflow', () => {
  it('creates pending drafts in manual mode by default', () => {
    const now = new Date('2026-06-10T08:30:00.000Z')
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now,
    })

    expect(draft.status).toBe('pending')
    expect(draft.mode).toBe('manual')
    expect(draft.version).toBe(1)
    expect(draft.reviewLog).toEqual([])
  })

  it('approves a pending draft and records reviewer metadata', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      mode: 'live',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const approved = approveDraft(draft, {
      actor: 'raul',
      notes: 'Looks good. Keep the CTA.',
      now: new Date('2026-06-10T08:31:00.000Z'),
    })

    expect(approved.status).toBe('approved')
    expect(approved.approvedAt?.toISOString()).toBe('2026-06-10T08:31:00.000Z')
    expect(approved.reviewLog.at(-1)).toMatchObject({
      decision: 'approve',
      actor: 'raul',
      notes: 'Looks good. Keep the CTA.',
    })
  })

  it('turns an edit decision into a fresh pending revision and preserves lineage', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const { previousDraft, nextDraft } = editDraft(draft, {
      actor: 'raul',
      notes: 'Make it warmer and shorter.',
      content: 'Wanted to follow up and see if a quick next step makes sense.',
      now: new Date('2026-06-10T08:32:00.000Z'),
    })

    expect(previousDraft.supersededById).toBe('draft-1-v2')
    expect(previousDraft.reviewLog.at(-1)).toMatchObject({
      decision: 'edit',
      actor: 'raul',
      nextDraftId: 'draft-1-v2',
    })
    expect(nextDraft.id).toBe('draft-1-v2')
    expect(nextDraft.version).toBe(2)
    expect(nextDraft.status).toBe('pending')
    expect(nextDraft.content).toContain('quick next step')
    expect(nextDraft.reviewLog).toHaveLength(1)
  })

  it('rejects a pending draft and requires a reason for auditability', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const rejected = rejectDraft(draft, {
      actor: 'raul',
      notes: 'Too salesy for this lead.',
      now: new Date('2026-06-10T08:33:00.000Z'),
    })

    expect(rejected.status).toBe('rejected')
    expect(rejected.rejectionReason).toBe('Too salesy for this lead.')
    expect(rejected.reviewLog.at(-1)).toMatchObject({
      decision: 'reject',
      actor: 'raul',
      notes: 'Too salesy for this lead.',
    })
  })

  it('blocks approving a rejected draft', () => {
    const draft = rejectDraft(
      createDraft({
        id: 'draft-1',
        leadId: 'lead-1',
        stage: 'first-follow-up',
        content: 'Checking in after our demo.',
      }),
      {
        actor: 'raul',
        notes: 'Not the right tone.',
      },
    )

    expect(() =>
      approveDraft(draft, {
        actor: 'raul',
        notes: 'Actually send it.',
      }),
    ).toThrow('only pending drafts can be approved')
  })
})
