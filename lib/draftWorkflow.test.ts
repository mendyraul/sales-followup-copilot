import { describe, expect, it } from 'vitest'
import { approveDraft, createDraft, currentDraftRevision, draftHistory, editDraft, rejectDraft } from './draftWorkflow'

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
    expect(approved.reviewLog[approved.reviewLog.length - 1]).toMatchObject({
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
    expect(previousDraft.reviewLog[previousDraft.reviewLog.length - 1]).toMatchObject({
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



  it('tracks draft history lineage across revisions', () => {
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

    const approved = approveDraft(nextDraft, {
      actor: 'raul',
      notes: 'Ship this version.',
      now: new Date('2026-06-10T08:33:00.000Z'),
    })

    expect(approved.supersedesId).toBe('draft-1')
    expect(draftHistory([previousDraft, approved], approved.id).map((entry) => entry.id)).toEqual(['draft-1'])
    expect(currentDraftRevision([previousDraft, approved], previousDraft.id)?.id).toBe('draft-1-v2')
  })

  it('walks multi-revision lineage back to the original draft', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const firstEdit = editDraft(draft, {
      actor: 'raul',
      notes: 'Make it warmer and shorter.',
      content: 'Wanted to follow up and see if a quick next step makes sense.',
      now: new Date('2026-06-10T08:32:00.000Z'),
    })

    const secondEdit = editDraft(firstEdit.nextDraft, {
      actor: 'raul',
      notes: 'Add a clearer CTA.',
      content: 'Wanted to follow up and see if a quick recap plus next step would help.',
      now: new Date('2026-06-10T08:35:00.000Z'),
    })

    const approved = approveDraft(secondEdit.nextDraft, {
      actor: 'raul',
      notes: 'Ship this one.',
      now: new Date('2026-06-10T08:36:00.000Z'),
    })

    const records = [
      firstEdit.previousDraft,
      secondEdit.previousDraft,
      approved,
    ]

    expect(draftHistory(records, approved.id).map((entry) => entry.id)).toEqual([
      'draft-1',
      'draft-1-v2',
    ])
    expect(currentDraftRevision(records, 'draft-1')?.id).toBe('draft-1-v2-v3')
    expect(currentDraftRevision(records, 'draft-1-v2')?.id).toBe('draft-1-v2-v3')
  })

  it('gracefully stops lineage traversal when a revision is missing from the loaded record set', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const firstEdit = editDraft(draft, {
      actor: 'raul',
      notes: 'Make it warmer and shorter.',
      content: 'Wanted to follow up and see if a quick next step makes sense.',
      now: new Date('2026-06-10T08:32:00.000Z'),
    })

    const secondEdit = editDraft(firstEdit.nextDraft, {
      actor: 'raul',
      notes: 'Add a clearer CTA.',
      content: 'Wanted to follow up and see if a quick recap plus next step would help.',
      now: new Date('2026-06-10T08:35:00.000Z'),
    })

    expect(
      draftHistory([secondEdit.previousDraft, secondEdit.nextDraft], secondEdit.nextDraft.id).map((entry) => entry.id),
    ).toEqual(['draft-1-v2'])

    expect(currentDraftRevision([firstEdit.previousDraft], firstEdit.previousDraft.id)?.id).toBe('draft-1')
    expect(currentDraftRevision([secondEdit.previousDraft], secondEdit.previousDraft.id)?.id).toBe('draft-1-v2')
  })

  it('breaks safely when loaded lineage data contains a cycle', () => {
    const firstDraft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const secondDraft = {
      ...firstDraft,
      id: 'draft-1-v2',
      version: 2,
      createdAt: new Date('2026-06-10T08:31:00.000Z'),
      updatedAt: new Date('2026-06-10T08:31:00.000Z'),
      supersedesId: 'draft-1',
    }

    const cyclicFirst = {
      ...firstDraft,
      supersededById: 'draft-1-v2',
      supersedesId: 'draft-1-v2',
    }

    const cyclicSecond = {
      ...secondDraft,
      supersededById: 'draft-1',
    }

    expect(draftHistory([cyclicFirst, cyclicSecond], cyclicSecond.id).map((entry) => entry.id)).toEqual(['draft-1'])
    expect(currentDraftRevision([cyclicFirst, cyclicSecond], cyclicFirst.id)?.id).toBe('draft-1-v2')
    expect(currentDraftRevision([cyclicFirst, cyclicSecond], cyclicSecond.id)?.id).toBe('draft-1')
  })

  it('returns empty history for unknown drafts', () => {
    expect(draftHistory([], 'missing-draft')).toEqual([])
    expect(currentDraftRevision([], 'missing-draft')).toBeUndefined()
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
    expect(rejected.reviewLog[rejected.reviewLog.length - 1]).toMatchObject({
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

  it('blocks editing or rejecting drafts once they are no longer pending', () => {
    const approvedDraft = approveDraft(
      createDraft({
        id: 'draft-approved',
        leadId: 'lead-1',
        stage: 'first-follow-up',
        content: 'Checking in after our demo.',
        now: new Date('2026-06-10T08:30:00.000Z'),
      }),
      {
        actor: 'raul',
        notes: 'Ready to send.',
        now: new Date('2026-06-10T08:31:00.000Z'),
      },
    )

    expect(() =>
      editDraft(approvedDraft, {
        actor: 'raul',
        notes: 'Actually tweak the CTA.',
        content: 'Wanted to follow up with a softer CTA.',
        now: new Date('2026-06-10T08:32:00.000Z'),
      }),
    ).toThrow('only pending drafts can be edited')

    expect(() =>
      rejectDraft(approvedDraft, {
        actor: 'raul',
        notes: 'Never mind.',
        now: new Date('2026-06-10T08:33:00.000Z'),
      }),
    ).toThrow('only pending drafts can be rejected')

    const rejectedDraft = rejectDraft(
      createDraft({
        id: 'draft-rejected',
        leadId: 'lead-2',
        stage: 'first-follow-up',
        content: 'Checking in after our demo.',
        now: new Date('2026-06-10T09:00:00.000Z'),
      }),
      {
        actor: 'raul',
        notes: 'Tone is off.',
        now: new Date('2026-06-10T09:01:00.000Z'),
      },
    )

    expect(() =>
      editDraft(rejectedDraft, {
        actor: 'raul',
        notes: 'Try a different revision.',
        content: 'Wanted to follow up with a different tone.',
        now: new Date('2026-06-10T09:02:00.000Z'),
      }),
    ).toThrow('only pending drafts can be edited')
  })

  it('trims reviewer metadata when approving or editing drafts', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    const approved = approveDraft(draft, {
      actor: '  raul  ',
      notes: '  Keep the CTA but soften the opener.  ',
      now: new Date('2026-06-10T08:31:00.000Z'),
    })

    expect(approved.reviewLog[0]).toMatchObject({
      actor: 'raul',
      notes: 'Keep the CTA but soften the opener.',
    })

    const revised = editDraft(draft, {
      actor: '  raul  ',
      notes: '  Make it warmer.  ',
      content: '  Wanted to follow up and see if a quick recap would help.  ',
      now: new Date('2026-06-10T08:32:00.000Z'),
    })

    expect(revised.previousDraft.reviewLog[0]).toMatchObject({
      actor: 'raul',
      notes: 'Make it warmer.',
      nextDraftId: 'draft-1-v2',
    })
    expect(revised.nextDraft).toMatchObject({
      id: 'draft-1-v2',
      content: 'Wanted to follow up and see if a quick recap would help.',
    })
    expect(revised.nextDraft.reviewLog[0]).toMatchObject({
      actor: 'raul',
      notes: 'Make it warmer.',
    })
  })

  it('rejects blank rejection notes after trimming whitespace', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    expect(() =>
      rejectDraft(draft, {
        actor: 'raul',
        notes: '   ',
        now: new Date('2026-06-10T08:33:00.000Z'),
      }),
    ).toThrow('notes is required')
  })

  it('blocks blank reviewer actors across approve, edit, and reject actions', () => {
    const draft = createDraft({
      id: 'draft-1',
      leadId: 'lead-1',
      stage: 'first-follow-up',
      content: 'Checking in after our demo.',
      now: new Date('2026-06-10T08:30:00.000Z'),
    })

    expect(() =>
      approveDraft(draft, {
        actor: '   ',
        notes: 'Looks fine.',
        now: new Date('2026-06-10T08:31:00.000Z'),
      }),
    ).toThrow('actor is required')

    expect(() =>
      editDraft(draft, {
        actor: '\n\t  ',
        notes: 'Tighten the opener.',
        content: 'Wanted to follow up with a tighter next step.',
        now: new Date('2026-06-10T08:32:00.000Z'),
      }),
    ).toThrow('actor is required')

    expect(() =>
      rejectDraft(draft, {
        actor: '  ',
        notes: 'Needs a clearer CTA before review.',
        now: new Date('2026-06-10T08:33:00.000Z'),
      }),
    ).toThrow('actor is required')
  })
})
