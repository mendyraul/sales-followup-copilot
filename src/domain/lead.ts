export type LeadStatus = 'new' | 'contacted' | 'replied' | 'hot' | 'won' | 'lost';

export type Lead = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string | null;
  lastReplyAt?: string | null;
};

export const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'lost'],
  contacted: ['replied', 'hot', 'lost'],
  replied: ['hot', 'won', 'lost'],
  hot: ['won', 'lost'],
  won: [],
  lost: []
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return allowedTransitions[from].includes(to);
}
