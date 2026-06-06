import type { Lead } from './lead';

export function nextActionScore(lead: Lead, now = new Date()): number {
  const updated = new Date(lead.updatedAt).getTime();
  const ageHours = Math.max(0, (now.getTime() - updated) / 3600000);
  const statusWeight = lead.status === 'hot' ? 100 : lead.status === 'replied' ? 60 : lead.status === 'contacted' ? 40 : 20;
  return statusWeight + Math.min(72, ageHours);
}

export function needsAttention(leads: Lead[]): Lead[] {
  return [...leads]
    .filter(l => ['new', 'contacted', 'replied', 'hot'].includes(l.status))
    .sort((a, b) => nextActionScore(b) - nextActionScore(a));
}
