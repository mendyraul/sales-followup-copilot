# Feedback capture

Open **Activity & feedback**, optionally select a related lead, choose a rating from 1–5, add a category and comment, then save. The database records the entry and its audit event in one transaction. Reload to verify persistence. The dashboard shows the 100 most recent entries.

Comments are required and limited to 3,000 characters; categories are optional free text up to 80 characters. Ratings outside 1–5 are rejected. `FEEDBACK_CAPTURE_ENABLED=false` disables writes. `FEEDBACK_DEFAULT_CHANNEL` defaults to `in_app`.

Feedback is local operator input. No external notifications or contact automation are triggered. Deleting a related lead retains feedback and clears the relation.
