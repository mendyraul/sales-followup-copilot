# Feedback

Activity & feedback saves ratings and comments privately within the current workspace, with workspace-scoped history. No external tracker or analytics receives these records automatically. Operators can disable writes with FEEDBACK_CAPTURE_ENABLED=false.

The separate maintainer feedback panel accepts a title and description, optionally adds app version/mode, and displays a preview. Only after preview does it offer a GitHub issue-form link or clipboard copy. Opening the link does not submit an issue; the user posts it on GitHub. Contact records, notes, messages and credentials are never attached automatically. Remove client information before public sharing.

Owner-only workflow counts are calculated from local workspace history: overdue actions, completed follow-ups and active days in the last 14 days. They stay in the instance and are not marketing telemetry.
