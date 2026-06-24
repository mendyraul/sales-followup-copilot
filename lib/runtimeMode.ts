export type SendMode = 'manual' | 'test' | 'live'

const normalize = (value?: string | null): string => (value ?? '').trim().toLowerCase()

export function getSendMode(envValue = process.env.SEND_MODE): SendMode {
  const mode = normalize(envValue)

  if (mode === 'live') {
    return 'live'
  }

  if (mode === 'test') {
    return 'test'
  }

  return 'manual'
}

export function isManualMode(envValue = process.env.SEND_MODE): boolean {
  return getSendMode(envValue) === 'manual'
}

export function isTestMode(envValue = process.env.SEND_MODE): boolean {
  return getSendMode(envValue) === 'test'
}

export function isNonLiveMode(envValue = process.env.SEND_MODE): boolean {
  return getSendMode(envValue) !== 'live'
}
