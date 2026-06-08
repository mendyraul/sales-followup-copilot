# Feedback Capture

Manual-safe feedback capture for QA and product iteration.

## What gets stored
- `rating` from 1-5
- optional `category`: `ux`, `quality`, `bug`, `other`
- optional freeform `comments`
- optional `leadId` link back to a lead
- `channel` source tag (default `in_app`)
- optional structured `metadata`

## Environment variables
- `FEEDBACK_CAPTURE_ENABLED=true` keeps the path available in local/dev.
- `FEEDBACK_DEFAULT_CHANNEL=in_app` sets the default source tag.

## Suggested workflow
1. Capture reviewer feedback after a draft is read or edited.
2. Normalize and validate the payload before writing it.
3. Store it in `FeedbackEntry` for later QA triage.
4. Review trends weekly to improve prompts, UX, or guardrails.
