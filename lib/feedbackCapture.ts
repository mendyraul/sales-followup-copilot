export type FeedbackChannel = 'email' | 'sms' | 'call' | 'in-app';

export type FeedbackInput = {
  leadEmail: string;
  rating: number;
  comment?: string;
  channel: FeedbackChannel;
  submittedAt?: string;
};

export type FeedbackRecord = {
  id: string;
  leadEmail: string;
  rating: number;
  comment: string | null;
  channel: FeedbackChannel;
  submittedAt: string;
};

const feedbackStore: FeedbackRecord[] = [];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeComment(comment?: string): string | null {
  if (!comment) return null;
  const trimmed = comment.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

export function captureFeedback(input: FeedbackInput): FeedbackRecord {
  const leadEmail = normalizeEmail(input.leadEmail);
  if (!leadEmail.includes('@')) {
    throw new Error('leadEmail must be a valid email address');
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('rating must be an integer between 1 and 5');
  }

  const record: FeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    leadEmail,
    rating: input.rating,
    comment: normalizeComment(input.comment),
    channel: input.channel,
    submittedAt: input.submittedAt ?? new Date().toISOString()
  };

  feedbackStore.push(record);
  return { ...record };
}

export function listFeedback(): FeedbackRecord[] {
  return feedbackStore.map((item) => ({ ...item }));
}

export function clearFeedbackStore(): void {
  feedbackStore.length = 0;
}
