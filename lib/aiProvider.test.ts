import { describe, expect, it, vi } from 'vitest';
import {
  buildOpenAiPrompt,
  createAiProvider,
  createMockProvider,
  normalizeProvider
} from './aiProvider';

describe('normalizeProvider', () => {
  it('defaults to mock when provider is omitted', () => {
    expect(normalizeProvider(undefined)).toBe('mock');
  });

  it('normalizes supported provider values', () => {
    expect(normalizeProvider(' OPENAI ')).toBe('openai');
  });

  it('rejects unsupported providers', () => {
    expect(() => normalizeProvider('anthropic')).toThrow(/Unsupported AI provider/);
  });
});

describe('createMockProvider', () => {
  it('returns a deterministic draft for safe local development', async () => {
    const provider = createMockProvider();
    const draft = await provider.generateDraft({
      leadName: 'Jordan',
      companyName: 'Northwind',
      objective: 'the Q3 rollout',
      recentContext: 'they asked for a simple next-step recap',
      tone: 'consultative'
    });

    expect(draft.provider).toBe('mock');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('Q3 rollout');
    expect(draft.body).toContain('they asked for a simple next-step recap');
    expect(draft.warnings).toContain('mock-provider: deterministic local draft only');
  });
});

describe('createAiProvider', () => {
  it('builds a mock provider when configured for safe mode', async () => {
    const provider = createAiProvider({ provider: 'mock' });
    const draft = await provider.generateDraft({ leadName: 'Avery' });

    expect(provider.id).toBe('mock');
    expect(draft.subject).toContain('Avery');
  });

  it('requires an API key before enabling openai mode', () => {
    expect(() => createAiProvider({ provider: 'openai', apiKey: '' })).toThrow(/AI_API_KEY/);
  });

  it('uses the OpenAI responses API contract when configured', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          subject: 'Quick follow-up for Jordan',
          body: 'Hi Jordan, just circling back with the next step.'
        })
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan', objective: 'our pricing recap' });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('next step');
  });

  it('rejects whitespace-only OpenAI draft payloads', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          subject: '   ',
          body: '\n\n'
        })
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    await expect(provider.generateDraft({ leadName: 'Jordan' })).rejects.toThrow(/invalid JSON payload/i);
  });
});

describe('buildOpenAiPrompt', () => {
  it('includes the core generation context', () => {
    const prompt = buildOpenAiPrompt({
      leadName: 'Jordan',
      companyName: 'Northwind',
      recentContext: 'they want implementation timing',
      objective: 'the pilot program',
      tone: 'direct'
    });

    expect(prompt).toContain('Lead name: Jordan');
    expect(prompt).toContain('Company: Northwind');
    expect(prompt).toContain('Recent context: they want implementation timing');
    expect(prompt).toContain('Tone: direct');
  });
});
