import type { Lead } from './lead';

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
  const updated = new Date(lead.updatedAt).getTime();
  const ageHours = Math.max(0, (now.getTime() - updated) / 3600000);
  const statusWeight = lead.status === 'hot' ? 100 : lead.status === 'replied' ? 60 : lead.status === 'contacted' ? 40 : 20;
  return statusWeight + Math.min(72, ageHours);
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

export function needsAttention(leads: Lead[], now = new Date()): Lead[] {
  return buildQueue(leads, now).map((item) => item.lead);
}
