import {
  buildMockDraft,
  createAiProvider,
  type AiProviderConfig,
  type DraftGenerationInput,
  type DraftGenerationResult
} from './aiProvider';

export type FirstFollowupTone = DraftGenerationInput['tone'];
export type FirstFollowupContextSource = 'recentContext' | 'leadSource';
export type FirstFollowupObjectiveSource = 'explicit' | 'default';

export type FirstFollowupDraftRequest = {
  leadName: string;
  companyName?: string;
  recentContext?: string;
  leadSource?: string;
  desiredNextStep?: string;
  tone?: FirstFollowupTone;
  writingProfile?: DraftGenerationInput["writingProfile"];
};

export type FirstFollowupReviewContext = {
  leadName: string;
  companyName?: string;
  recentContext?: string;
  objective: string;
  objectiveSource: FirstFollowupObjectiveSource;
  tone: FirstFollowupTone;
  contextSources: FirstFollowupContextSource[];
  missingFields: string[];
};

export type FirstFollowupDraftResult = DraftGenerationResult & {
  reviewChecklist: string[];
  reviewContext: FirstFollowupReviewContext;
};

export const FIRST_FOLLOWUP_REVIEW_CHECKLIST = [
  'Confirm the draft reflects the latest lead context before sending.',
  'Verify any requested next step or CTA is accurate and still available.',
  'Keep SEND_MODE=manual until a human explicitly approves outbound delivery.'
];

export function buildFirstFollowupWarnings(
  reviewContext: FirstFollowupReviewContext
): string[] {
  const warnings: string[] = [];

  if (reviewContext.objectiveSource === 'default') {
    warnings.push(
      'manual-review: desiredNextStep was missing, so the draft falls back to a generic follow-up objective'
    );
  }

  if (!reviewContext.contextSources.includes('recentContext')) {
    warnings.push(
      'manual-review: no recentContext note was provided, so the opening line may need more lead-specific detail'
    );
  }

  if (!reviewContext.companyName) {
    warnings.push(
      'manual-review: companyName is missing, so the subject/body may be less specific than the final outreach should be'
    );
  }

  return warnings;
}

export function buildFirstFollowupInput(
  request: FirstFollowupDraftRequest
): DraftGenerationInput {
  const leadName = request.leadName.trim();

  if (!leadName) {
    throw new Error('leadName is required to generate a first follow-up draft.');
  }

  const sourceContext = request.leadSource?.trim()
    ? `you first reached out through ${request.leadSource.trim()}`
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
    tone: request.tone ?? 'friendly',
    ...(request.writingProfile?{writingProfile:request.writingProfile}:{})
  };
}

export function buildFirstFollowupReviewContext(
  request: FirstFollowupDraftRequest
): FirstFollowupReviewContext {
  const input = buildFirstFollowupInput(request);
  const contextSources: FirstFollowupContextSource[] = [];

  if (request.recentContext?.trim()) {
    contextSources.push('recentContext');
  }

  if (request.leadSource?.trim()) {
    contextSources.push('leadSource');
  }

  const missingFields = [
    !input.companyName ? 'companyName' : null,
    !request.recentContext?.trim() ? 'recentContext' : null,
    !request.leadSource?.trim() ? 'leadSource' : null,
    !request.desiredNextStep?.trim() ? 'desiredNextStep' : null,
  ].filter((value): value is string => Boolean(value));

  return {
    leadName: input.leadName,
    companyName: input.companyName,
    recentContext: input.recentContext,
    objective: input.objective ?? '',
    objectiveSource: request.desiredNextStep?.trim() ? 'explicit' : 'default',
    tone: input.tone ?? 'friendly',
    contextSources,
    missingFields,
  };
}

export async function generateFirstFollowupDraft(
  request: FirstFollowupDraftRequest,
  config: AiProviderConfig
): Promise<FirstFollowupDraftResult> {
  const provider = createAiProvider(config);
  const draft = await provider.generateDraft(buildFirstFollowupInput(request));
  const reviewContext = buildFirstFollowupReviewContext(request);

  return {
    ...draft,
    warnings: [...draft.warnings, ...buildFirstFollowupWarnings(reviewContext)],
    reviewChecklist: FIRST_FOLLOWUP_REVIEW_CHECKLIST,
    reviewContext,
  };
}

export function buildDemoFirstFollowupDraft(
  request: FirstFollowupDraftRequest
): FirstFollowupDraftResult {
  const draft = buildMockDraft(buildFirstFollowupInput(request));
  const reviewContext = buildFirstFollowupReviewContext(request);

  return {
    ...draft,
    warnings: [...draft.warnings, ...buildFirstFollowupWarnings(reviewContext)],
    reviewChecklist: FIRST_FOLLOWUP_REVIEW_CHECKLIST,
    reviewContext,
  };
}
