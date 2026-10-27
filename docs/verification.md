# Demo verification · 2026-10-27

The previous dashboard rendered static fixtures. This release connects the operator workflow to PostgreSQL through validated, transactional commands.

Local checks passed: lint, TypeScript, 151 unit tests, production build, and three production browser scenarios. The dependency audit reports zero vulnerabilities. Browser checks use a separate database and actual API writes, with no network interception or provider calls. They verify persistence after reload, review revision history and concurrency conflicts, opt-out enforcement, feedback, import rollback, cross-origin validation, and a 390px layout. An additional legacy migration rehearsal preserves an existing lead and approved draft, backfilling revision 1 with its original text.

CI repeats these checks on a clean install with disposable Postgres databases. Optional external AI calls, public authentication, and delivery are outside the local demo; no message is sent by any workspace action.

## Open issue coverage

| Issues       | Delivered evidence                                                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1, #2       | Existing repository and frontend/domain structure, now with a functional API/server layer.                                                                                    |
| #3           | Committed Prisma migrations, persistent leads/notes/events/drafts/revisions/feedback/audit, fresh and legacy-upgrade verification.                                            |
| #4, #5       | Create, edit, delete and status transitions through the UI/API; validated transitions, opt-out and closed-lead handling; persisted browser coverage.                          |
| #6           | Responsive database-backed pipeline, search/status filters, urgency/stale indicators and queue counts.                                                                        |
| #7, #30      | Rewritten README with reproducible demo command, developer setup, walkthrough, migration guidance and accurate operating limits.                                              |
| #8           | CI for PRs and main pushes: clean install, audit, lint/type/unit/build, fresh migrations, legacy upgrade and real browser tests.                                              |
| #9, #10, #11 | Existing tested provider contract and prompt builder connected to saved lead context, mock draft generation and revisioned human review. No live call is needed for the demo. |
| #15          | Audit writes in the same transactions as mutations, visible activity log and deletion records retained.                                                                       |
| #22          | Saved notes and lead timeline, surfaced to draft generation and verified across reloads.                                                                                      |
| #23          | Domain/provider tests plus real Postgres/browser workflows replacing static fixture/README-heading assertions.                                                                |
| #25          | Updated executable manual QA walkthrough and automated core coverage.                                                                                                         |
| #29          | Persisted in-app feedback with validation, channel, feature flag, related lead and audit entry.                                                                               |
