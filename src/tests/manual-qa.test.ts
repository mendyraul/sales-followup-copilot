import { describe, expect, it } from 'vitest';
import { demoManualQaChecklist } from '../data/demoManualQaChecklist';
import { summarizeManualQaChecklist } from '../domain/manual-qa';

describe('summarizeManualQaChecklist', () => {
  it('reports the seeded operator checklist coverage', () => {
    expect(summarizeManualQaChecklist(demoManualQaChecklist)).toEqual({
      totalItems: 5,
      readyItems: 4,
      watchItems: 1,
      areas: ['startup', 'queue', 'timeline', 'import', 'outbound'],
    });
  });
});
