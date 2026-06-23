import type { Lead } from "./lead";
import { nextActionScore } from "./queue";

export type HotLeadFlag = {
  isHot: boolean;
  reason: string;
  score: number;
};

const HOT_LEAD_SCORE = 90;

export function getHotLeadFlag(lead: Lead, now = new Date()): HotLeadFlag {
  const score = nextActionScore(lead, now);
  const explicitHot = lead.status === 'hot';
  const scoreDrivenHot = lead.status === 'replied' && score >= HOT_LEAD_SCORE;
  const isHot = explicitHot || scoreDrivenHot;

  if (explicitHot) {
    return { isHot, score, reason: 'Lead is already marked hot in the pipeline.' };
  }

  if (scoreDrivenHot) {
    return {
      isHot,
      score,
      reason: 'Recent engagement plus queue score pushed this lead into hot-lead review.',
    };
  }

  return {
    isHot: false,
    score,
    reason: 'Lead stays in the regular queue until engagement or wait time increases.',
  };
}

export function listHotLeads(leads: Lead[], now = new Date()): Array<Lead & { hotLeadFlag: HotLeadFlag }> {
  return leads
    .map((lead) => ({ ...lead, hotLeadFlag: getHotLeadFlag(lead, now) }))
    .filter((lead) => lead.hotLeadFlag.isHot)
    .sort((a, b) => b.hotLeadFlag.score - a.hotLeadFlag.score);
}
