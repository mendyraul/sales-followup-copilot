import { describe, expect, it } from 'vitest';
import { buildFirstFollowupInput, generateFirstFollowupDraft } from './firstFollowupDraft';

describe('buildFirstFollowupInput', () => {
  it('builds a manual-safe default first-followup payload', () => {
    expect(
      buildFirstFollowupInput({
        leadName: 'Alex',
        companyName: 'Northwind',
        recentContext: 'they asked about onboarding timelines',
        leadSource: 'web demo form'
      })
    ).toEqual({
      leadName: 'Alex',
      companyName: 'Northwind',
      recentContext: 'they asked about onboarding timelines Lead source: web demo form.',
      objective: 're-engaging after the first conversation and confirming the best next step',
      tone: 'friendly'
    });
  });

  it('prefers an explicit desired next step and custom tone', () => {
    expect(
      buildFirstFollowupInput({
        leadName: ' Jordan ',
        desiredNextStep: 'booking a 20-minute pricing review',
        tone: 'consultative'
      })
    ).toEqual({
      leadName: 'Jordan',
      companyName: undefined,
      recentContext: undefined,
      objective: 'booking a 20-minute pricing review',
      tone: 'consultative'
    });
  });

  it('falls back to the default objective when desired next step trims blank', () => {
    expect(
      buildFirstFollowupInput({
        leadName: ' Jordan ',
        companyName: '   ',
        recentContext: '   ',
        leadSource: ' partner referral ',
        desiredNextStep: '   '
      })
    ).toEqual({
      leadName: 'Jordan',
      companyName: undefined,
      recentContext: 'Lead source: partner referral.',
      objective: 're-engaging after the first conversation and confirming the best next step',
      tone: 'friendly'
    });
  });

  it('keeps trimmed recent context without adding extra whitespace when no lead source exists', () => {
    expect(
      buildFirstFollowupInput({
        leadName: 'Morgan',
        recentContext: '  asked for a concise recap before the next call  ',
        leadSource: '   ',
        tone: 'direct'
      })
    ).toEqual({
      leadName: 'Morgan',
      companyName: undefined,
      recentContext: 'asked for a concise recap before the next call',
      objective: 're-engaging after the first conversation and confirming the best next step',
      tone: 'direct'
    });
  });

  it('rejects blank lead names', () => {
    expect(() => buildFirstFollowupInput({ leadName: '   ' })).toThrow(
      'leadName is required to generate a first follow-up draft.'
    );
  });
});

describe('generateFirstFollowupDraft', () => {
  it('uses the deterministic mock provider and adds a review checklist', async () => {
    const result = await generateFirstFollowupDraft(
      {
        leadName: 'Casey',
        companyName: 'Acme',
        recentContext: 'they wanted a recap before sharing it internally',
        desiredNextStep: 'sending a concise recap and booking a follow-up'
      },
      { provider: 'mock' }
    );

    expect(result.provider).toBe('mock');
    expect(result.subject).toContain('Casey');
    expect(result.body).toContain('sending a concise recap and booking a follow-up');
    expect(result.warnings).toContain('mock-provider: deterministic local draft only');
    expect(result.reviewChecklist).toEqual([
      'Confirm the draft reflects the latest lead context before sending.',
      'Verify any requested next step or CTA is accurate and still available.',
      'Keep SEND_MODE=manual until a human explicitly approves outbound delivery.'
    ]);
  });
});
