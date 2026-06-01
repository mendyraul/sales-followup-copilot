function optionalText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

export function normalizeFeedback(input = {}, fallbackChannel = 'in_app') {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating must be an integer from 1 to 5');
  }

  const channel = optionalText(input.channel) || optionalText(fallbackChannel) || 'in_app';

  const metadata = input.metadata == null
    ? null
    : (typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : null);

  return {
    leadId: optionalText(input.leadId),
    rating,
    category: optionalText(input.category),
    comments: optionalText(input.comments),
    channel,
    metadata
  };
}
