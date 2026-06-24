import { describe, expect, it } from 'vitest';
import {
  getStageDefinition,
  isTerminalStage,
  listFollowUpStages,
  nextStage,
  stageProgress,
  summarizeNextAction
} from '../domain/followup';

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

describe('follow-up stage metadata', () => {
  it('lists the full follow-up sequence in order', () => {
    expect(listFollowUpStages().map(stage => stage.stage)).toEqual(['new', 'drafted', 'approved', 'sent']);
  });

  it('exposes progress and next-action guidance for review steps', () => {
    expect(stageProgress('approved')).toBe(66);
    expect(summarizeNextAction('drafted')).toContain('Edit the draft');
  });

  it('marks only sent as terminal and exposes readable labels', () => {
    expect(isTerminalStage('new')).toBe(false);
    expect(isTerminalStage('drafted')).toBe(false);
    expect(isTerminalStage('approved')).toBe(false);
    expect(isTerminalStage('sent')).toBe(true);
    expect(getStageDefinition('approved').label).toBe('Approved to send');
  });
});
