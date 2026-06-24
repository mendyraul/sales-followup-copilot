export type FollowUpStage = 'new' | 'drafted' | 'approved' | 'sent';

export type FollowUpStageDefinition = {
  stage: FollowUpStage;
  label: string;
  description: string;
  recommendedAction: string;
  progressPercent: number;
  terminal: boolean;
};

export const followUpStages: FollowUpStageDefinition[] = [
  {
    stage: 'new',
    label: 'New lead',
    description: 'Lead is captured and waiting for the first follow-up draft.',
    recommendedAction: 'Review the lead context and generate the first outreach draft.',
    progressPercent: 0,
    terminal: false
  },
  {
    stage: 'drafted',
    label: 'Draft prepared',
    description: 'A follow-up draft exists and is waiting for human review.',
    recommendedAction: 'Edit the draft for tone, accuracy, and offer details before approval.',
    progressPercent: 33,
    terminal: false
  },
  {
    stage: 'approved',
    label: 'Approved to send',
    description: 'The message is approved and ready for a manual send step.',
    recommendedAction: 'Send in manual mode and log the outbound touch in the timeline.',
    progressPercent: 66,
    terminal: false
  },
  {
    stage: 'sent',
    label: 'Sent',
    description: 'The follow-up has been delivered and the lead is awaiting a response.',
    recommendedAction: 'Watch for reply activity and re-queue only if the lead goes stale.',
    progressPercent: 100,
    terminal: true
  }
];

const stageMap = Object.fromEntries(followUpStages.map(definition => [definition.stage, definition])) as Record<
  FollowUpStage,
  FollowUpStageDefinition
>;

export function getStageDefinition(stage: FollowUpStage): FollowUpStageDefinition {
  return stageMap[stage];
}

export function listFollowUpStages(): FollowUpStageDefinition[] {
  return [...followUpStages];
}

export function nextStage(stage: FollowUpStage): FollowUpStage {
  switch (stage) {
    case 'new':
      return 'drafted';
    case 'drafted':
      return 'approved';
    case 'approved':
      return 'sent';
    case 'sent':
      return 'sent';
  }
}

export function isTerminalStage(stage: FollowUpStage): boolean {
  return getStageDefinition(stage).terminal;
}

export function stageProgress(stage: FollowUpStage): number {
  return getStageDefinition(stage).progressPercent;
}

export function summarizeNextAction(stage: FollowUpStage): string {
  return getStageDefinition(stage).recommendedAction;
}
