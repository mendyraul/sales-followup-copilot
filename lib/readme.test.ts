import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8')

describe('README launch playbook', () => {
  it('keeps the operator playbook headings and manual-safe checklist', () => {
    expect(readme).toContain('## Launch README / operator playbook')
    expect(readme).toContain('### Launch readiness checklist')
    expect(readme).toContain('### Recommended launch walk-through')
    expect(readme).toContain('### Manual QA focus')
    expect(readme).toContain('### Common launch blockers and fast fixes')
    expect(readme).toContain('### Operator sign-off notes')
    expect(readme).toContain('`SEND_MODE=manual` by default')
    expect(readme).toContain('No live provider is enabled by default')
  })

  it('links operators to the supporting docs needed for launch', () => {
    expect(readme).toContain('[`docs/environment-variables.md`](docs/environment-variables.md)')
    expect(readme).toContain('[`docs/feedback-capture.md`](docs/feedback-capture.md)')
    expect(readme).toContain('[`docs/deployment.md`](docs/deployment.md)')
  })
})
