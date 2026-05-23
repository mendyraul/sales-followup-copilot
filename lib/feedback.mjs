export function normalizeFeedback(input = {}, fallbackChannel = 'in_app') {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating must be an integer from 1 to 5');
  }
  return {
    leadId: input.leadId || null,
    rating,
    category: input.category || null,
    comments: input.comments || null,
    channel: input.channel || fallbackChannel,
    metadata: input.metadata || null
  };
}
