import { buildFollowupPromptTemplate } from './followupPromptTemplate';

export type AiProviderId = 'mock' | 'openai';

export type DraftGenerationInput = {
  leadName: string;
  companyName?: string;
  recentContext?: string;
  objective?: string;
  tone?: 'friendly' | 'direct' | 'consultative';
};

export type DraftGenerationResult = {
  provider: AiProviderId;
  subject: string;
  body: string;
  warnings: string[];
};

export type AiProviderConfig = {
  provider: string | undefined;
  apiKey?: string | undefined;
  model?: string | undefined;
  fetchImpl?: typeof fetch;
};

export interface AiProvider {
  readonly id: AiProviderId;
  generateDraft(input: DraftGenerationInput): Promise<DraftGenerationResult>;
}

type OpenAiResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type OpenAiDraftPayload = {
  subject?: string;
  body?: string;
};

const SUPPORTED_PROVIDERS: AiProviderId[] = ['mock', 'openai'];

export function normalizeProvider(provider: string | undefined): AiProviderId {
  const normalized = (provider ?? 'mock').trim().toLowerCase();

  if (SUPPORTED_PROVIDERS.includes(normalized as AiProviderId)) {
    return normalized as AiProviderId;
  }

  throw new Error(
    `Unsupported AI provider \`${provider}\`. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
  );
}

export function createAiProvider(config: AiProviderConfig): AiProvider {
  const provider = normalizeProvider(config.provider);

  if (provider === 'openai') {
    return createOpenAiProvider(config);
  }

  return createMockProvider();
}

export function createMockProvider(): AiProvider {
  return {
    id: 'mock',
    async generateDraft(input) {
      return buildMockDraft(input);
    }
  };
}

export function buildMockDraft(input: DraftGenerationInput): DraftGenerationResult {
  const objective = input.objective?.trim() || 'checking in on your priorities';
  const context = input.recentContext?.trim();
  const tone = input.tone ?? 'friendly';
  const companyLine = input.companyName ? ` at ${input.companyName}` : '';
  const contextLine = context ? `I kept in mind that ${context}. ` : '';
  const toneLine =
    tone === 'direct'
      ? 'I wanted to send a concise follow-up.'
      : tone === 'consultative'
        ? 'I wanted to share a thoughtful follow-up based on what matters most to you.'
        : 'I wanted to send a quick, helpful follow-up.';

  return {
    provider: 'mock',
    subject: `Following up with ${input.leadName}${companyLine}`,
    body: [
      `Hi ${input.leadName},`,
      '',
      `${toneLine} ${contextLine}I\'m reaching out about ${objective}.`,
      'If it helps, I can send over a concise recap and the best next step from our side.',
      '',
      'Best,',
      'Sales Follow-Up Copilot'
    ].join('\n'),
    warnings: ['mock-provider: deterministic local draft only']
  };
}

function createOpenAiProvider(config: AiProviderConfig): AiProvider {
  const apiKey = config.apiKey?.trim();

  if (!apiKey) {
    throw new Error('AI provider `openai` requires AI_API_KEY to be set.');
  }

  const fetchImpl = config.fetchImpl ?? fetch;
  const model = config.model?.trim() || 'gpt-4o-mini';

  return {
    id: 'openai',
    async generateDraft(input) {
      const prompt = buildOpenAiPrompt(input);
      const response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: 'You write concise, manual-review sales follow-up drafts. Return a JSON object with subject and body only.'
                }
              ]
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: prompt }]
            }
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'sales_followup_draft',
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  subject: { type: 'string' },
                  body: { type: 'string' }
                },
                required: ['subject', 'body']
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI draft generation failed with status ${response.status}`);
      }

      const payload = (await response.json()) as OpenAiResponsesPayload;
      const parsed = extractOpenAiDraftPayload(payload);
      const subject = parsed.subject?.trim();
      const body = parsed.body?.trim();

      if (!subject || !body) {
        throw new Error('OpenAI draft generation returned invalid JSON payload.');
      }

      return {
        provider: 'openai',
        subject,
        body,
        warnings: []
      };
    }
  };
}

function extractOpenAiDraftPayload(payload: OpenAiResponsesPayload): OpenAiDraftPayload {
  const candidateTexts = [payload.output_text]
    .concat(
      (payload.output ?? []).flatMap((item) =>
        (item.content ?? [])
          .filter((entry) => entry.type === 'output_text' && typeof entry.text === 'string')
          .map((entry) => entry.text as string)
      )
    )
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (candidateTexts.length === 0) {
    throw new Error('OpenAI draft generation returned no output_text payload.');
  }

  for (const candidateText of candidateTexts) {
    for (const jsonCandidate of extractJsonCandidates(candidateText)) {
      try {
        const parsed = JSON.parse(jsonCandidate) as OpenAiDraftPayload;

        if (hasUsableDraftFields(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
  }

  throw new Error('OpenAI draft generation returned invalid JSON payload.');
}

function extractJsonCandidates(value: string): string[] {
  const trimmed = value.trim();
  const fencedMatches = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
    .map((match) => match[1]?.trim())
    .filter((match): match is string => Boolean(match));

  const candidates = [trimmed, ...extractBalancedJsonObjects(trimmed)];

  return [...fencedMatches, ...candidates.filter((candidate) => !fencedMatches.includes(candidate))];
}

function extractBalancedJsonObjects(value: string): string[] {
  const matches: string[] = [];
  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (character === '\\' && inString) {
      escaping = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{') {
      if (depth === 0) {
        startIndex = index;
      }

      depth += 1;
      continue;
    }

    if (character === '}' && depth > 0) {
      depth -= 1;

      if (depth === 0 && startIndex >= 0) {
        matches.push(value.slice(startIndex, index + 1).trim());
        startIndex = -1;
      }
    }
  }

  return matches.filter(Boolean);
}

function hasUsableDraftFields(payload: OpenAiDraftPayload): boolean {
  return Boolean(payload.subject?.trim() && payload.body?.trim());
}

export function buildOpenAiPrompt(input: DraftGenerationInput): string {
  return buildFollowupPromptTemplate(input);
}
