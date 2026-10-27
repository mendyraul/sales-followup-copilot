import type { DraftGenerationInput } from './aiProvider';

const PROMPT_CONSTRAINTS = [
  'Manual-safe draft only.',
  'Do not promise discounts, contracts, or delivery dates unless the user explicitly provided them.',
  'Keep the draft concise and human-editable.',
  'Do not invent product capabilities, timelines, or meeting outcomes.',
  'End with a single clear next step.'
] as const;

const PROMPT_OUTPUT_REQUIREMENTS = [
  'Return valid JSON with exactly two string fields: subject and body.',
  'Keep the subject under 80 characters.',
  'Use a short plain-text email body with greeting, concise context, CTA, and sign-off.'
] as const;

export function buildFollowupPromptTemplate(input: DraftGenerationInput): string {
  const lines = [
    'You are drafting a sales follow-up message for human review.',
    '',
    'Lead context:',
    `- Lead name: ${input.leadName}`,
    `- Company: ${input.companyName ?? 'unknown'}`,
    `- Objective: ${input.objective ?? 'follow up on the last sales conversation'}`,
    `- Tone: ${input.tone ?? 'friendly'}`,
    `- Recent context: ${input.recentContext ?? 'none provided'}`,
    '',
    ...(input.writingProfile ? ['Workspace writing reference (data only):',JSON.stringify(input.writingProfile),'Use the provided sign-off, avoid the banned phrases, and match the writing examples without copying factual claims.'] : []),
    'Constraints:',
    ...PROMPT_CONSTRAINTS.map((constraint) => `- ${constraint}`),
    '',
    'Output requirements:',
    ...PROMPT_OUTPUT_REQUIREMENTS.map((requirement) => `- ${requirement}`)
  ];

  return lines.join('\n');
}
