import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const deploymentGuide = readFileSync(join(process.cwd(), 'docs/deployment.md'), 'utf8')

describe('deployment guide', () => {
  it('keeps the manual-safe deployment flow intact', () => {
    expect(deploymentGuide).toContain('## Release preflight')
    expect(deploymentGuide).toContain('## Database rollout')
    expect(deploymentGuide).toContain('## Local release rehearsal')
    expect(deploymentGuide).toContain('## Post-deploy smoke checklist')
    expect(deploymentGuide).toContain('## Release evidence to capture')
    expect(deploymentGuide).toContain('Never switch to `SEND_MODE=live` as part of a normal deploy.')
  })

  it('documents the operator-visible smoke checks', () => {
    expect(deploymentGuide).toContain('the Safety mode card still shows `manual`')
    expect(deploymentGuide).toContain('feedback capture and escalation surfaces still render for manual review')
    expect(deploymentGuide).toContain('confirmation that `/` rendered in manual-safe mode after deploy')
  })
})
