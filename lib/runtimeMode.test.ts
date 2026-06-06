import { describe, expect, it } from 'vitest'
import { getSendMode, isTestMode } from './runtimeMode'

describe('runtime mode safety defaults', () => {
  it('defaults to manual/test mode when SEND_MODE is missing', () => {
    expect(getSendMode(undefined)).toBe('manual')
    expect(isTestMode(undefined)).toBe(true)
  })

  it('keeps manual/test mode for unknown values', () => {
    expect(getSendMode('production')).toBe('manual')
    expect(isTestMode('something-else')).toBe(true)
  })

  it('enables live mode only when explicitly set to live', () => {
    expect(getSendMode('live')).toBe('live')
    expect(isTestMode('live')).toBe(false)
  })
})
