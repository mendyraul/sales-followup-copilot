# Feedback Capture

Manual-safe feedback capture for QA and product iteration.

## What gets stored
- required `category`: `ux`, `result_quality`, `bug`, `other`
- required `sentiment`: `positive`, `neutral`, `negative`
- required freeform `message`
- optional 1-5 `score`
- optional `leadId` link back to a lead
- `source` tag (`in_app`, `email`, or `internal_note`)
- optional structured `metadata`

## Environment variables
- `FEEDBACK_CAPTURE_ENABLED=true` keeps the path available in local/dev.
- `FEEDBACK_DEFAULT_CHANNEL=in_app` sets the default source tag.

## Suggested workflow
1. Capture reviewer feedback after a draft is read or edited.
2. Normalize and validate the payload before writing it.
3. Store it in `FeedbackEntry` for later QA triage.
4. Review trends weekly to improve prompts, UX, or guardrails.
5. Use the seeded feedback inbox on `/` to confirm the review loop stays visible in manual mode before any live send path exists.
6. Review the follow-up queue for negative or score-3-and-below entries before demos so the sharpest issues get a human response first.
7. Keep the linked lead context visible during triage so reviewers can see status/email without leaving the dashboard.
8. Check the dashboard's feedback hotspots panel to spot leads with repeated unresolved notes before generating another draft.

