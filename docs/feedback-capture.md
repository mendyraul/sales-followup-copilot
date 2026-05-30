# Feedback Capture Mechanism

This module provides a safe MVP feedback pipeline for manual/test-mode follow-up runs.

## What it does
- Validates feedback input (email + 1-5 rating)
- Normalizes/sanitizes optional comments
- Captures the source channel (`email`, `sms`, `call`, `in-app`)
- Stores records in an in-memory collection for early-stage testing

## Usage

```ts
import { captureFeedback, listFeedback } from '../lib/feedbackCapture';

captureFeedback({
  leadEmail: 'prospect@example.com',
  rating: 4,
  comment: 'Follow-up felt timely and relevant.',
  channel: 'email'
});

const allFeedback = listFeedback();
```

## Notes
- This is intentionally in-memory for MVP safety and speed.
- Production migration path: persist to PostgreSQL via Prisma model + audit metadata.
