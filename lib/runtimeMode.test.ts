import { describe, expect, it } from 'vitest'
import { getSendMode, isManualMode, isNonLiveMode, isTestMode } from './runtimeMode'

describe('runtime mode safety defaults', () => {
  it('defaults to manual mode when SEND_MODE is missing', () => {
    expect(getSendMode(undefined)).toBe('manual')
    expect(isManualMode(undefined)).toBe(true)
    expect(isTestMode(undefined)).toBe(false)
    expect(isNonLiveMode(undefined)).toBe(true)
  })

  it('keeps manual mode for unknown values', () => {
    expect(getSendMode('production')).toBe('manual')
    expect(isManualMode('something-else')).toBe(true)
    expect(isTestMode('something-else')).toBe(false)
    expect(isNonLiveMode('something-else')).toBe(true)
  })

  it('supports explicit test mode without promoting to live sending', () => {
    expect(getSendMode('test')).toBe('test')
    expect(isManualMode('test')).toBe(false)
    expect(isTestMode('test')).toBe(true)
    expect(isNonLiveMode('test')).toBe(true)
  })

  it('normalizes casing and whitespace before evaluating live mode', () => {
    expect(getSendMode(' LIVE ')).toBe('live')
    expect(isTestMode(' LIVE ')).toBe(false)
  })

  it('treats blank values as manual/non-live mode', () => {
    expect(getSendMode('   ')).toBe('manual')
    expect(isTestMode('   ')).toBe(false)
    expect(isNonLiveMode('   ')).toBe(true)
  })

  it('enables live mode only when explicitly set to live', () => {
    expect(getSendMode('live')).toBe('live')
    expect(isManualMode('live')).toBe(false)
    expect(isTestMode('live')).toBe(false)
    expect(isNonLiveMode('live')).toBe(false)
  })
})
