import {
  buildMockDraft,
  createAiProvider,
  type AiProviderConfig,
  type DraftGenerationInput,
  type DraftGenerationResult
} from './aiProvider';

export type FirstFollowupTone = DraftGenerationInput['tone'];

export type FirstFollowupDraftRequest = {
  leadName: string;
  companyName?: string;
  recentContext?: string;
  leadSource?: string;
  desiredNextStep?: string;
  tone?: FirstFollowupTone;
};

export type FirstFollowupDraftResult = DraftGenerationResult & {
  reviewChecklist: string[];
};

export const FIRST_FOLLOWUP_REVIEW_CHECKLIST = [
  'Confirm the draft reflects the latest lead context before sending.',
  'Verify any requested next step or CTA is accurate and still available.',
  'Keep SEND_MODE=manual until a human explicitly approves outbound delivery.'
];

export function buildFirstFollowupInput(
  request: FirstFollowupDraftRequest
): DraftGenerationInput {
  const leadName = request.leadName.trim();

  if (!leadName) {
    throw new Error('leadName is required to generate a first follow-up draft.');
  }

  const sourceContext = request.leadSource?.trim()
    ? `Lead source: ${request.leadSource?.trim()}.`
    : '';
  const recentContext = request.recentContext?.trim() ?? '';
  const combinedContext = [recentContext, sourceContext].filter(Boolean).join(' ');
  const desiredNextStep = request.desiredNextStep?.trim();

  return {
    leadName,
    companyName: request.companyName?.trim() || undefined,
    recentContext: combinedContext || undefined,
    objective:
      desiredNextStep ||
      're-engaging after the first conversation and confirming the best next step',
    tone: request.tone ?? 'friendly'
  };
}

export async function generateFirstFollowupDraft(
  request: FirstFollowupDraftRequest,
  config: AiProviderConfig
): Promise<FirstFollowupDraftResult> {
  const provider = createAiProvider(config);
  const draft = await provider.generateDraft(buildFirstFollowupInput(request));

  return {
    ...draft,
    reviewChecklist: FIRST_FOLLOWUP_REVIEW_CHECKLIST
  };
}

export function buildDemoFirstFollowupDraft(
  request: FirstFollowupDraftRequest
): FirstFollowupDraftResult {
  return {
    ...buildMockDraft(buildFirstFollowupInput(request)),
    reviewChecklist: FIRST_FOLLOWUP_REVIEW_CHECKLIST
  };
}
