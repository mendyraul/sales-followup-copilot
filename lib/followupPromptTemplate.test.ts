import { describe, expect, it } from 'vitest';
import { buildFollowupPromptTemplate } from './followupPromptTemplate';

describe('buildFollowupPromptTemplate', () => {
  it('builds a manual-safe prompt with lead context and output constraints', () => {
    const prompt = buildFollowupPromptTemplate({
      leadName: 'Jordan',
      companyName: 'Northwind',
      recentContext: 'they asked for implementation timing and pricing guardrails',
      objective: 'booking a 20-minute pilot review',
      tone: 'consultative'
    });

    expect(prompt).toContain('You are drafting a sales follow-up message for human review.');
    expect(prompt).toContain('- Lead name: Jordan');
    expect(prompt).toContain('- Company: Northwind');
    expect(prompt).toContain('- Objective: booking a 20-minute pilot review');
    expect(prompt).toContain('- Tone: consultative');
    expect(prompt).toContain('- Recent context: they asked for implementation timing and pricing guardrails');
    expect(prompt).toContain('- Do not invent product capabilities, timelines, or meeting outcomes.');
    expect(prompt).toContain('- Return valid JSON with exactly two string fields: subject and body.');
  });

  it('fills safe defaults when optional fields are omitted', () => {
    const prompt = buildFollowupPromptTemplate({ leadName: 'Casey' });

    expect(prompt).toContain('- Company: unknown');
    expect(prompt).toContain('- Objective: follow up on the last sales conversation');
    expect(prompt).toContain('- Tone: friendly');
    expect(prompt).toContain('- Recent context: none provided');
  });
});
