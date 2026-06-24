export type LeadFollowupState = {
  leadId: string;
  leadEmail: string;
  lastContactedAt?: string;
  nextFollowupAt?: string;
  status?: 'new' | 'active' | 'paused' | 'closed';
};

export type StaleLeadResult = {
  leadId: string;
  leadEmail: string;
  stale: boolean;
  staleDays: number;
  reason: 'status-closed' | 'status-paused' | 'missing-contact' | 'inactive-window';
};

function dayDiff(fromIso: string, now: Date): number {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) {
    throw new Error('Invalid date supplied for lead activity');
  }
  return Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function detectStaleLeads(
  leads: LeadFollowupState[],
  options?: { staleAfterDays?: number; now?: Date }
): StaleLeadResult[] {
  const staleAfterDays = options?.staleAfterDays ?? 7;
  const now = options?.now ?? new Date();

  return leads.map((lead) => {
    if (lead.status === 'closed') {
      return { leadId: lead.leadId, leadEmail: lead.leadEmail, stale: false, staleDays: 0, reason: 'status-closed' };
    }

    if (lead.status === 'paused') {
      return { leadId: lead.leadId, leadEmail: lead.leadEmail, stale: false, staleDays: 0, reason: 'status-paused' };
    }

    const activityDate = lead.nextFollowupAt ?? lead.lastContactedAt;
    if (!activityDate) {
      return { leadId: lead.leadId, leadEmail: lead.leadEmail, stale: true, staleDays: staleAfterDays, reason: 'missing-contact' };
    }

    const staleDays = dayDiff(activityDate, now);
    return {
      leadId: lead.leadId,
      leadEmail: lead.leadEmail,
      stale: staleDays >= staleAfterDays,
      staleDays,
      reason: 'inactive-window'
    };
  });
}
