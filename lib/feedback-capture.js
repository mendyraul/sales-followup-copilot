export const allowedSources = new Set(["ui", "email", "manual", "api"]);

export function validateFeedback(input) {
  if (!input || typeof input !== "object") throw new Error("feedback payload is required");
  if (!input.issueId || typeof input.issueId !== "string") throw new Error("issueId is required");
  if (!input.message || typeof input.message !== "string") throw new Error("message is required");
  if (input.message.length > 2000) throw new Error("message too long");
  if (input.source && !allowedSources.has(input.source)) throw new Error("invalid source");
}

export function normalizeFeedback(input) {
  validateFeedback(input);
  return {
    issueId: input.issueId.trim(),
    message: input.message.trim(),
    source: input.source || "manual",
    sentiment: input.sentiment || "neutral",
    createdAt: new Date().toISOString(),
    metadata: input.metadata || {}
  };
}
