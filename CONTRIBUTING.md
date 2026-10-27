# Contributing

Follow Through is free software under the MIT license. Useful feedback, documentation fixes, reproductions and small pull requests are welcome. There are no paid feature tiers.

Start with the README's development setup and use a separate test database. Run lint, typecheck, unit/integration tests and the production browser suite before submitting a PR. For a database change, add an additive migration and exercise both fresh installation and existing-data upgrades. Preserve credential-free export/restore and workspace isolation.

Explain the concrete problem and resulting behavior in your PR, include relevant validation, and keep unrelated changes separate. Discuss substantial changes in an issue before building them. Contributions are made under the repository's MIT license; preserve third-party notices.

Never put customer records, email contents, credentials or production backups in issues, screenshots or fixtures. The app's feedback preview lets you choose exactly what to share; self-hosted feedback stays in your instance unless you share it explicitly. For security reports, follow SECURITY.md.

The project focuses on consultants and small agencies: reliable next actions, low-friction contact history, human-reviewed drafts, clear ownership and portable data. Prospect auto-sending, billing, Outlook sync and CRM lead scraping are outside this release.
