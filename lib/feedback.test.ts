import { describe, expect, it } from 'vitest'
import { normalizeFeedback } from './feedback'

describe('normalizeFeedback', () => {
  it('normalizes valid payloads', () => {
    expect(
      normalizeFeedback({
        leadId: ' lead_123 ',
        rating: 4,
        category: ' Quality ',
        comments: ' Helpful draft ',
        channel: ' email ',
        metadata: { source: 'qa' },
      })
    ).toEqual({
      leadId: 'lead_123',
      rating: 4,
      category: 'quality',
      comments: 'Helpful draft',
      channel: 'email',
      metadata: { source: 'qa' },
    })
  })

  it('uses fallback channel and strips empty optional fields', () => {
    expect(normalizeFeedback({ rating: 5, comments: '   ' }, 'slack')).toEqual({
      leadId: null,
      rating: 5,
      category: null,
      comments: null,
      channel: 'slack',
      metadata: null,
    })
  })

  it('rejects invalid ratings', () => {
    expect(() => normalizeFeedback({ rating: 0 })).toThrow(/rating/)
    expect(() => normalizeFeedback({ rating: 6 })).toThrow(/rating/)
    expect(() => normalizeFeedback({ rating: 2.5 })).toThrow(/rating/)
  })

  it('rejects invalid categories', () => {
    expect(() => normalizeFeedback({ rating: 3, category: 'sales' })).toThrow(/category/)
  })
})
