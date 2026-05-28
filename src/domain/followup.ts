export type FollowUpStage = 'new' | 'drafted' | 'approved' | 'sent';

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
  return stage === 'sent';
}
