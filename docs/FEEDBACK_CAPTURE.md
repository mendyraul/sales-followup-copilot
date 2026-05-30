# Feedback Capture Mechanism

This project now includes a safe, manual-first feedback capture design for beta users.

## Goals
- Capture usability feedback directly in the app or via support workflow
- Keep feedback auditable and queryable
- Avoid live outbound automation by default

## Data Model
Feedback is stored in Prisma model `FeedbackCapture` with:
- `leadId` (optional relation to `Lead`)
- `source` (`in-app`, `email`, `call`, etc.)
- `category` (`bug`, `ux`, `feature`, `general`)
- `message` (required)
- `rating` (optional 1-5)
- `contactEmail` (optional)
- `contextJson` (optional serialized metadata)
- `createdAt`

## Manual-safe workflow
1. User/team member submits feedback in app or internal admin flow.
2. Entry is written to `FeedbackCapture`.
3. Team reviews feedback manually and maps it to follow-up issues.

No automatic outbound messaging is required for this mechanism.

## Next Implementation Step
- Add API route: `POST /api/feedback`
- Validate payload (zod)
- Write record with Prisma client
- Add simple feedback form in dashboard UI
