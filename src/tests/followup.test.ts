import { describe, expect, it } from 'vitest';
import { isTerminalStage, nextStage } from '../domain/followup';

describe('nextStage', () => {
  it('advances through the sequence', () => {
    expect(nextStage('new')).toBe('drafted');
    expect(nextStage('drafted')).toBe('approved');
    expect(nextStage('approved')).toBe('sent');
  });

  it('stays terminal once sent', () => {
    expect(nextStage('sent')).toBe('sent');
  });
});

describe('isTerminalStage', () => {
  it('marks only sent as terminal', () => {
    expect(isTerminalStage('new')).toBe(false);
    expect(isTerminalStage('drafted')).toBe(false);
    expect(isTerminalStage('approved')).toBe(false);
    expect(isTerminalStage('sent')).toBe(true);
  });

  it('becomes terminal exactly after the final transition', () => {
    const stage1 = nextStage('new');
    const stage2 = nextStage(stage1);
    const stage3 = nextStage(stage2);

    expect(isTerminalStage(stage1)).toBe(false);
    expect(isTerminalStage(stage2)).toBe(false);
    expect(isTerminalStage(stage3)).toBe(true);
    expect(nextStage(stage3)).toBe(stage3);
  });
});
