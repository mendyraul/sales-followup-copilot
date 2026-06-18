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
});
