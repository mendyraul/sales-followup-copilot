import type { Lead } from './lead';

export type StaleLeadReason = 'status-closed' | 'missing-activity' | 'inactive-window';

export type StaleLeadResult = {
  lead: Lead;
  stale: boolean;
  staleDays: number;
  reason: StaleLeadReason;
};

export type StaleLeadOptions = {
  staleAfterDays?: number;
  now?: Date;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function dayDiff(fromIso: string, now: Date): number {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) {
    throw new Error('Invalid lead activity timestamp');
  }

  return Math.floor((now.getTime() - from.getTime()) / MS_PER_DAY);
}

function isClosedLead(status: Lead['status']): boolean {
  return status === 'won' || status === 'lost';
}

export function detectStaleLeads(leads: Lead[], options: StaleLeadOptions = {}): StaleLeadResult[] {
  const staleAfterDays = options.staleAfterDays ?? 7;
  const now = options.now ?? new Date();

  return leads.map((lead) => {
    if (isClosedLead(lead.status)) {
      return {
        lead,
        stale: false,
        staleDays: 0,
        reason: 'status-closed'
      };
    }

    const activityDate = lead.updatedAt || lead.createdAt;
    if (!activityDate) {
      return {
        lead,
        stale: true,
        staleDays: staleAfterDays,
        reason: 'missing-activity'
      };
    }

    const staleDays = dayDiff(activityDate, now);
    return {
      lead,
      stale: staleDays >= staleAfterDays,
      staleDays,
      reason: 'inactive-window'
    };
  });
}

export function staleLeadSummary(leads: Lead[], options: StaleLeadOptions = {}): StaleLeadResult[] {
  return detectStaleLeads(leads, options)
    .filter((result) => result.stale)
    .sort((a, b) => b.staleDays - a.staleDays);
}
