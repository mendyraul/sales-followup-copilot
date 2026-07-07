import { describe, expect, it } from 'vitest';
import {
  buildDemoFirstFollowupDraft,
  buildFirstFollowupInput,
  buildFirstFollowupReviewContext,
  buildFirstFollowupWarnings,
  FIRST_FOLLOWUP_REVIEW_CHECKLIST,
  generateFirstFollowupDraft
} from './firstFollowupDraft';

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
    expect(result.warnings).not.toContain(
      'manual-review: desiredNextStep was missing, so the draft falls back to a generic follow-up objective'
    );
    expect(result.reviewChecklist).toEqual(FIRST_FOLLOWUP_REVIEW_CHECKLIST);
    expect(result.reviewContext).toEqual({
      leadName: 'Casey',
      companyName: 'Acme',
      recentContext: 'they wanted a recap before sharing it internally',
      objective: 'sending a concise recap and booking a follow-up',
      objectiveSource: 'explicit',
      tone: 'friendly',
      contextSources: ['recentContext'],
      missingFields: ['leadSource'],
    });
  });
});

describe('buildFirstFollowupReviewContext', () => {
  it('flags inferred vs explicit review inputs for manual QA', () => {
    expect(
      buildFirstFollowupReviewContext({
        leadName: 'Jordan',
        leadSource: 'partner intro',
      })
    ).toEqual({
      leadName: 'Jordan',
      companyName: undefined,
      recentContext: 'Lead source: partner intro.',
      objective: 're-engaging after the first conversation and confirming the best next step',
      objectiveSource: 'default',
      tone: 'friendly',
      contextSources: ['leadSource'],
      missingFields: ['companyName', 'recentContext', 'desiredNextStep'],
    });
  });
});

describe('buildFirstFollowupWarnings', () => {
  it('surfaces manual-review warnings when the draft relies on fallback inputs', () => {
    expect(
      buildFirstFollowupWarnings(
        buildFirstFollowupReviewContext({
          leadName: 'Jordan',
          leadSource: 'partner intro',
        })
      )
    ).toEqual([
      'manual-review: desiredNextStep was missing, so the draft falls back to a generic follow-up objective',
      'manual-review: no recentContext note was provided, so the opening line may need more lead-specific detail',
      'manual-review: companyName is missing, so the subject/body may be less specific than the final outreach should be',
    ]);
  });
});

describe('buildDemoFirstFollowupDraft', () => {
  it('builds a seeded manual-safe draft preview without async provider setup', () => {
    const result = buildDemoFirstFollowupDraft({
      leadName: 'Jordan',
      companyName: 'Northwind',
      recentContext: 'Phone call went to voicemail. Next step is a short value-focused email with two proof points.',
      desiredNextStep: 'sending a concise recap and booking a short review',
      tone: 'direct'
    });

    expect(result.provider).toBe('mock');
    expect(result.subject).toContain('Jordan');
    expect(result.body).toContain('Phone call went to voicemail');
    expect(result.body).toContain('sending a concise recap and booking a short review');
    expect(result.warnings).toContain('mock-provider: deterministic local draft only');
    expect(result.warnings).not.toContain(
      'manual-review: desiredNextStep was missing, so the draft falls back to a generic follow-up objective'
    );
    expect(result.reviewChecklist).toEqual(FIRST_FOLLOWUP_REVIEW_CHECKLIST);
    expect(result.reviewContext.contextSources).toEqual(['recentContext']);
    expect(result.reviewContext.missingFields).toEqual(['leadSource']);
  });

  it('adds fallback warnings when review inputs are missing', () => {
    const result = buildDemoFirstFollowupDraft({
      leadName: 'Jordan',
      leadSource: 'partner intro',
    });

    expect(result.warnings).toEqual([
      'mock-provider: deterministic local draft only',
      'manual-review: desiredNextStep was missing, so the draft falls back to a generic follow-up objective',
      'manual-review: no recentContext note was provided, so the opening line may need more lead-specific detail',
      'manual-review: companyName is missing, so the subject/body may be less specific than the final outreach should be',
    ]);
  });
});
