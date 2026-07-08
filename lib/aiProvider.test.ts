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

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0];
    expect(requestUrl).toBe('https://api.openai.com/v1/responses');
    expect(requestInit).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
    });

    expect(JSON.parse(requestInit.body)).toMatchObject({
      model: 'gpt-4o-mini',
      text: {
        format: {
          type: 'json_schema',
          name: 'sales_followup_draft',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['subject', 'body'],
          },
        },
      },
    });
  });

  it('defaults blank model config before building the OpenAI request body', async () => {
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
      model: '   ',
      fetchImpl
    });

    await provider.generateDraft({ leadName: 'Jordan' });

    const [, requestInit] = fetchImpl.mock.calls[0];
    expect(JSON.parse(requestInit.body)).toMatchObject({
      model: 'gpt-4o-mini',
    });
  });

  it('falls back to structured output content when output_text is absent', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  subject: 'Quick follow-up for Jordan',
                  body: 'Hi Jordan, sharing the next safe step for review.'
                })
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('next safe step');
  });

  it('accepts nested structured output when the content text is present but the type field is omitted', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                text: JSON.stringify({
                  subject: 'Quick follow-up for Jordan',
                  body: 'Hi Jordan, this reviewed draft should still parse even without a content type.'
                })
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('without a content type');
  });

  it('falls back to structured output content when top-level output_text is only whitespace', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: '   \n  ',
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  subject: 'Quick follow-up for Jordan',
                  body: 'Hi Jordan, this nested output should still drive the reviewed draft.'
                })
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('nested output should still drive');
  });

  it('skips malformed candidates when a later structured output contains valid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: '{not valid json',
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  subject: 'Quick follow-up for Jordan',
                  body: 'Hi Jordan, the second output block still provides the reviewed draft.'
                })
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('second output block');
  });

  it('skips parsed candidates with blank required fields when a later output contains a valid draft', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          subject: 'Quick follow-up for Jordan',
          body: '   '
        }),
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  subject: 'Quick follow-up for Jordan',
                  body: 'Hi Jordan, this later reviewed draft should still win.'
                })
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('later reviewed draft should still win');
  });

  it('accepts JSON wrapped in markdown code fences', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: ['```json', JSON.stringify({
          subject: 'Quick follow-up for Jordan',
          body: 'Hi Jordan, here is the reviewed next step.'
        }), '```'].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('reviewed next step');
  });

  it('accepts fenced JSON even when the model adds a short prose preamble', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: [
          'Here is the reviewed draft:',
          '```json',
          JSON.stringify({
            subject: 'Quick follow-up for Jordan',
            body: 'Hi Jordan, the fenced JSON should still be extracted after a short preamble.'
          }),
          '```'
        ].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('fenced JSON should still be extracted');
  });

  it('skips an earlier fenced block when a later fenced block contains the valid reviewed draft', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: [
          'Here is the schema example first:',
          '```json',
          '{"subject": "", "body": ""}',
          '```',
          'Reviewed draft below:',
          '```json',
          JSON.stringify({
            subject: 'Quick follow-up for Jordan',
            body: 'Hi Jordan, the later fenced block should still provide the reviewed draft.'
          }),
          '```'
        ].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('later fenced block should still provide');
  });

  it('accepts plain JSON wrapped in short prose without markdown fences', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: [
          'Reviewed draft below.',
          JSON.stringify({
            subject: 'Quick follow-up for Jordan',
            body: 'Hi Jordan, plain JSON should still parse after a short prose wrapper.'
          }),
          'Let me know if you want another version.'
        ].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('plain JSON should still parse');
  });

  it('falls back to later plain JSON when an earlier fenced block is only a bad schema example', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: [
          'Schema example first:',
          '```json',
          '{"subject": "", "body": ""}',
          '```',
          'Reviewed draft below.',
          JSON.stringify({
            subject: 'Quick follow-up for Jordan',
            body: 'Hi Jordan, the parser should keep scanning after the fenced example and use this reviewed draft.'
          })
        ].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('keep scanning after the fenced example');
  });

  it('falls back to later plain JSON when an earlier fenced example contains unmatched JSON braces', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: [
          'Schema example first:',
          '```json',
          '{"subject":"example"',
          '```',
          'Reviewed draft below.',
          JSON.stringify({
            subject: 'Quick follow-up for Jordan',
            body: 'Hi Jordan, the parser should recover even after a broken fenced JSON example.'
          })
        ].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('recover even after a broken fenced JSON example');
  });

  it('parses plain JSON wrapped in prose when the draft body contains braces and quoted snippets', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: [
          'Use this reviewed draft:',
          JSON.stringify({
            subject: 'Quick follow-up for Jordan',
            body:
              'Hi Jordan, you mentioned the internal note `{"owner":"ops"}` and asked for the exact phrase "next best step" in the recap.'
          }),
          'Keep the tone consultative.'
        ].join('\n')
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('{"owner":"ops"}');
    expect(draft.body).toContain('"next best step"');
  });

  it('ignores malformed non-string top-level output_text values when later structured content is valid', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: { text: 'not a usable string payload' },
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  subject: 'Quick follow-up for Jordan',
                  body: 'Hi Jordan, nested structured output should still recover the reviewed draft.'
                })
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    const draft = await provider.generateDraft({ leadName: 'Jordan' });

    expect(draft.provider).toBe('openai');
    expect(draft.subject).toContain('Jordan');
    expect(draft.body).toContain('nested structured output should still recover');
  });

  it('surfaces upstream OpenAI status failures', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'temporary overload' } })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    await expect(provider.generateDraft({ leadName: 'Jordan' })).rejects.toThrow(
      'OpenAI draft generation failed with status 503'
    );
  });

  it('rejects OpenAI payloads that never include draft output text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: 'reasoning',
                text: 'Thinking about the best follow-up...'
              }
            ]
          }
        ]
      })
    });

    const provider = createAiProvider({
      provider: 'openai',
      apiKey: 'test-key',
      fetchImpl
    });

    await expect(provider.generateDraft({ leadName: 'Jordan' })).rejects.toThrow(
      'OpenAI draft generation returned no output_text payload.'
    );
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

    expect(prompt).toContain('- Lead name: Jordan');
    expect(prompt).toContain('- Company: Northwind');
    expect(prompt).toContain('- Recent context: they want implementation timing');
    expect(prompt).toContain('- Tone: direct');
    expect(prompt).toContain('Output requirements:');
  });
});
