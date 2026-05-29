export type Feedback = {
  id: string;
  leadId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  createdAt: string;
};

const feedbackStore: Feedback[] = [];

export function captureFeedback(input: {
  leadId: string;
  rating: number;
  notes?: string;
  createdAt?: string;
}): Feedback {
  const leadId = input.leadId?.trim();
  if (!leadId) throw new Error('leadId is required');
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('rating must be an integer from 1 to 5');
  }

  const feedback: Feedback = {
    id: `fb_${feedbackStore.length + 1}`,
    leadId,
    rating: input.rating as Feedback['rating'],
    notes: (input.notes ?? '').trim(),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  feedbackStore.push(feedback);
  return feedback;
}

export function listFeedbackByLead(leadId: string): Feedback[] {
  return feedbackStore.filter((f) => f.leadId === leadId);
}

export function clearFeedbackStore(): void {
  feedbackStore.length = 0;
}
