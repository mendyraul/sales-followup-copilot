function optionalText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizeFeedback(input = {}, fallbackChannel = 'in_app') {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating must be an integer from 1 to 5');
  }

  const channel = optionalText(input.channel) || optionalText(fallbackChannel) || 'in_app';

  return {
    leadId: optionalText(input.leadId),
    rating,
    category: optionalText(input.category),
    comments: optionalText(input.comments),
    channel,
    metadata: input.metadata || null
  };
}

module.exports = { normalizeFeedback };
