# Feedback Capture Mechanism

This project captures sales feedback at the lead level for auditability and tuning future follow-ups.

## Stored fields
- `leadId`: lead associated with feedback
- `source`: one of `email-reply`, `call-note`, `meeting`, `manual`
- `notes`: required free-text feedback
- `rating`: optional score (1-5)
- `sentiment`: optional `positive|neutral|negative`
- `capturedAt`: timestamp of when feedback occurred

## Validation
- `leadId` required
- `notes` required, max 5000 chars
- `rating` must be 1-5 when provided

## Next step
Wire `toFeedbackCreateData()` into the API route/UI action once lead CRUD screens are in place.
