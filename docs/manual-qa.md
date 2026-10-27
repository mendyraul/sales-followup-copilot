# Manual QA

Use fictional contacts and `npm run demo`.

- Create a lead, reload, select it, and verify name/email/context persist. Edit details and verify valid status transitions. Invalid transitions must return an error.
- Search by name, email, and source. Filter each status. Hot/aging leads should rise in priority; opted-out and closed leads should leave the follow-up queue.
- Save a note and reload. Generate a mock draft from that context with an explicit next step.
- Edit and save a revision; inspect history. Approve it, then edit it; approval must reset. Reject it. No action should send a message.
- Open the same draft in two tabs. Save a revision in one, then review the old revision in the other. The stale review must fail and preserve the newer text. Reload to continue.
- Opt out a lead. Generation and approval must be blocked. Delete the lead with confirmation and verify its deletion remains in Activity.
- Import CSV with quoted commas, escaped quotes, or multiline fields. Invalid rows, duplicate headers/emails, and existing-contact conflicts must block the entire import. Reload and verify successful imports persist.
- Submit a rating and feedback, reload, and verify it remains. Audit records must reflect saved changes.
- At 390px width, navigate, select/edit a lead, and verify there is no horizontal page overflow.
- Restart the demo and verify edited seed contacts retain their changes. Stop the database, reload, and check that the app shows an error and Retry control. Restart Postgres and retry.

CI covers the core persisted workflow, review conflicts, import rollback, API validation, and a mobile layout check. Optional live AI-provider behavior and public deployment are outside this local demo's verification.
