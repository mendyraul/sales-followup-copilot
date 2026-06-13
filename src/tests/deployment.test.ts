import { describe, expect, it } from 'vitest';
import { demoDeploymentChecklist } from '../data/demoDeploymentChecklist';
import { summarizeDeploymentChecklist } from '../domain/deployment';

describe('summarizeDeploymentChecklist', () => {
  it('reports the seeded deployment runbook coverage', () => {
    expect(summarizeDeploymentChecklist(demoDeploymentChecklist)).toEqual({
      totalItems: 4,
      readyItems: 3,
      watchItems: 1,
      areas: ['environment', 'database', 'application', 'rollback'],
    });
  });
});
