export type SendMode = 'manual' | 'live'

const normalize = (value?: string | null): string => (value ?? '').trim().toLowerCase()

export function getSendMode(envValue = process.env.SEND_MODE): SendMode {
  const mode = normalize(envValue)
  return mode === 'live' ? 'live' : 'manual'
}

export function isTestMode(envValue = process.env.SEND_MODE): boolean {
  return getSendMode(envValue) === 'manual'
}
