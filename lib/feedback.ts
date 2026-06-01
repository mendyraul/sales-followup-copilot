export type FeedbackInput = {
  leadId: string;
  source: "email-reply" | "call-note" | "meeting" | "manual";
  notes: string;
  rating?: number;
  sentiment?: "positive" | "neutral" | "negative";
  capturedAt?: Date;
};

export function validateFeedbackInput(input: FeedbackInput): void {
  const leadId = input.leadId?.trim();
  const notes = input.notes?.trim();

  if (!leadId) throw new Error("leadId is required");
  if (!notes) throw new Error("notes are required");
  if (notes.length > 5000) throw new Error("notes must be <= 5000 chars");
  if (typeof input.rating !== "undefined" && (input.rating < 1 || input.rating > 5)) {
    throw new Error("rating must be between 1 and 5");
  }
}

export function toFeedbackCreateData(input: FeedbackInput) {
  validateFeedbackInput(input);

  return {
    leadId: input.leadId.trim(),
    source: input.source,
    notes: input.notes.trim(),
    rating: input.rating,
    sentiment: input.sentiment,
    capturedAt: input.capturedAt ?? new Date()
  };
}
