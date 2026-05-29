import { describe, expect, it } from 'vitest'
import { captureFeedback } from './feedback'

describe('captureFeedback', () => {
  it('captures structured feedback with deterministic timestamp', () => {
    const now = new Date('2026-05-29T11:50:00.000Z')
    const feedback = captureFeedback(
      {
        leadId: 'lead_123',
        messageId: 'msg_777',
        type: 'positive',
        notes: '  Strong response from customer  ',
      },
      now,
    )

    expect(feedback.id).toBe('lead_123:msg_777:1780055400000')
    expect(feedback.notes).toBe('Strong response from customer')
    expect(feedback.createdAt).toEqual(now)
  })

  it('rejects empty leadId', () => {
    expect(() =>
      captureFeedback({ leadId: ' ', messageId: 'msg', type: 'neutral' }),
    ).toThrow('leadId is required')
  })
})
