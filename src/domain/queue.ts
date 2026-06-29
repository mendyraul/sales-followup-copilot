import type { Lead, LeadStatus } from './lead';

export type NextActionBand = 'urgent' | 'today' | 'soon';

export type NextAction = {
  score: number;
  band: NextActionBand;
  label: string;
  reason: string;
  ageHours: number;
  followUpStage: string;
};

const statusWeights: Record<LeadStatus, number> = {
  hot: 100,
  replied: 60,
  contacted: 40,
  new: 20,
  won: 0,
  lost: 0,
};

function ageHoursSince(updatedAt: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(updatedAt).getTime()) / 3600000);
}

function followUpStageFor(lead: Lead): string {
  switch (lead.status) {
    case 'new':
      return 'draft the first outreach';
    case 'contacted':
      return 'review for a reply or send a nudge';
    case 'replied':
      return 'prepare the next personalized response';
    case 'hot':
      return 'jump to a high-priority follow-up';
    case 'won':
      return 'no follow-up needed';
    case 'lost':
      return 'closed out';
  }
}

function bandFor(score: number): NextActionBand {
  if (score >= 100) return 'urgent';
  if (score >= 60) return 'today';
  return 'soon';
}

function labelFor(lead: Lead, band: NextActionBand): string {
  if (lead.status === 'hot') return 'Call or send a high-touch follow-up now';
  if (lead.status === 'replied') return band === 'urgent' ? 'Reply while momentum is hot' : 'Draft the next response';
  if (lead.status === 'contacted') return band === 'urgent' ? 'Send a nudge today' : 'Check for a response and queue a follow-up';
  return 'Start the first outreach';
}

function reasonFor(lead: Lead, ageHours: number, band: NextActionBand): string {
  const roundedAge = Math.round(ageHours);

  if (lead.status === 'hot') {
    return `Hot lead sitting ${roundedAge}h since the last touch, so it should be handled before the regular queue.`;
  }

  if (lead.status === 'replied') {
    return band === 'urgent'
      ? `Lead replied and has been waiting ${roundedAge}h, so the window for a strong response is closing.`
      : `Lead replied ${roundedAge}h ago, so the next personalized response should be prepared soon.`;
  }

  if (lead.status === 'contacted') {
    return band === 'urgent'
      ? `Lead was contacted ${roundedAge}h ago without movement, so it is ready for a same-day nudge.`
      : `Lead was contacted ${roundedAge}h ago, so it belongs in the active follow-up queue.`;
  }

  return `New lead has waited ${roundedAge}h without a first touch, so the first outreach should be drafted.`;
}

export function getNextAction(lead: Lead, now = new Date()): NextAction {
  const ageHours = ageHoursSince(lead.updatedAt, now);
  const score = statusWeights[lead.status] + Math.min(72, ageHours);
  const band = bandFor(score);

  return {
    score,
    band,
    label: labelFor(lead, band),
    reason: reasonFor(lead, ageHours, band),
    ageHours,
    followUpStage: followUpStageFor(lead),
  };
}

export type QueuePriority = 'high' | 'medium' | 'low';

export type QueueItem = {
  lead: Lead;
  score: number;
  priority: QueuePriority;
  ageHours: number;
  reason: string;
};

export type QueueGroups = Record<QueuePriority, QueueItem[]>;

const ACTIVE_STATUSES = ['new', 'contacted', 'replied', 'hot'] as const;
type ActiveLeadStatus = (typeof ACTIVE_STATUSES)[number];

function isActiveStatus(status: Lead['status']): status is ActiveLeadStatus {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

export function nextActionScore(lead: Lead, now = new Date()): number {
  return getNextAction(lead, now).score;
}

export function needsAttention(leads: Lead[], now = new Date()): Array<Lead & { nextAction: NextAction }> {
  return [...leads]
    .filter((lead) => ['new', 'contacted', 'replied', 'hot'].includes(lead.status))
    .map((lead) => ({ ...lead, nextAction: getNextAction(lead, now) }))
    .sort((a, b) => b.nextAction.score - a.nextAction.score)
}

export function queuePriority(score: number): QueuePriority {
  if (score >= 100) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function queueReason(lead: Lead, ageHours: number): string {
  if (lead.status === 'hot') {
    return ageHours >= 24 ? 'Hot lead has gone a full day without a follow-up.' : 'Hot lead needs the fastest response.';
  }

  if (lead.status === 'replied') {
    return ageHours >= 24 ? 'Lead replied and has been waiting more than a day.' : 'Lead replied and should get a follow-up queued.';
  }

  if (lead.status === 'contacted') {
    return ageHours >= 48 ? 'Previously contacted lead is cooling off without a next step.' : 'Contacted lead needs the next action scheduled.';
  }

  return ageHours >= 24 ? 'New lead has been sitting untouched for over a day.' : 'New lead should receive a first follow-up draft.';
}

export function buildQueue(leads: Lead[], now = new Date()): QueueItem[] {
  return [...leads]
    .filter((lead) => isActiveStatus(lead.status))
    .map((lead) => {
      const updated = new Date(lead.updatedAt).getTime();
      const ageHours = Math.max(0, (now.getTime() - updated) / 3600000);
      const score = nextActionScore(lead, now);

      return {
        lead,
        score,
        priority: queuePriority(score),
        ageHours,
        reason: queueReason(lead, ageHours),
      } satisfies QueueItem;
    })
    .sort((a, b) => b.score - a.score);
}

export function groupQueueByPriority(queue: QueueItem[]): QueueGroups {
  return queue.reduce<QueueGroups>(
    (groups, item) => {
      groups[item.priority].push(item);
      return groups;
    },
    { high: [], medium: [], low: [] }
  );
}
