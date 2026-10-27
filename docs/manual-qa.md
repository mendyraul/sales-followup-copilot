# Manual acceptance checks

Use fictional contacts in a disposable instance. Before a hosted pilot, repeat these with its actual HTTPS origin and at least two browser accounts.

1. Install with Docker, create an owner via the hidden CLI prompt, sign in and set workspace timezone. An unauthenticated API request must return 401 and public signup must be rejected.
2. Import five CSV contacts, including two people with the same name. Preview matches and explicitly choose create, merge or skip. A malformed row must roll back the whole import.
3. Schedule a task, switch Today/Overdue/Upcoming/No next action and Mine/Unassigned views. Snooze in the workspace timezone and complete it. Closed/opted-out contacts leave active follow-up queues.
4. Log an actual outbound interaction with note and next task. Check last contacted changes; an internal edit or note must not change it. Log a reply and check last reply separately.
5. With the worker healthy, assign an overdue task and confirm one in-app notification after repeated reconciliation. With a tested SMTP relay and opt-in preference, check delivery/digest. Inspect failures and uncertain states before a manual retry.
6. Save a writing profile, choose source notes and generate a template draft without any API key. Edit, approve, reload and inspect revision history. Editing an approved draft returns it to review; no approval sends mail.
7. If enabling Gmail, use a Google test user: connect, attach a selected thread only after sharing confirmation, sync twice without duplicate messages, receive a reply and inspect review flag. Reconnect and disconnect; inspect optional removal of imported copies.
8. If enabling AI, check disclosure and explicit confirmation, selected context, stored provenance, output limit, error handling and exhausted daily cap. Do not use real client content for initial testing.
9. Merge reviewed duplicates, choose the open task to keep and check both histories and old contact links. Export JSON, preview it and restore into a new workspace. Verify fresh IDs, cleared assignments and no credentials. Rehearse a separate PostgreSQL backup restore.
10. Invite a colleague, assign a lead and see the handoff. Remove the member: access disappears and work is unassigned. A member cannot export the workspace or alter owner-only settings.
11. Hide/reopen the guide; inspect local usage counts and private feedback. Preview public feedback without automatically submitting it or attaching customer records.
12. At 390px width, add a note and log an interaction without horizontal overflow. With over 100 contacts, navigate all pages and load older history. Restart services and verify persisted records and worker health.
