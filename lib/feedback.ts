export type FeedbackInput = {
  leadId: string;
  rating: "positive" | "neutral" | "negative";
  notes?: string;
  createdAt?: string;
};

export type FeedbackRecord = FeedbackInput & {
  id: string;
  createdAt: string;
};

const store = new Map<string, FeedbackRecord[]>();

export function captureFeedback(input: FeedbackInput): FeedbackRecord {
  if (!input.leadId?.trim()) throw new Error("leadId is required");

  const record: FeedbackRecord = {
    id: crypto.randomUUID(),
    leadId: input.leadId.trim(),
    rating: input.rating,
    notes: input.notes?.trim() || "",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  const existing = store.get(record.leadId) ?? [];
  existing.push(record);
  store.set(record.leadId, existing);
  return record;
}

export function listFeedback(leadId: string): FeedbackRecord[] {
  return [...(store.get(leadId.trim()) ?? [])];
}

export function resetFeedbackStore() {
  store.clear();
}
