# Environment variables

Keep `.env` local; it is ignored by Git. Node 22 scripts and Next load it automatically. Existing process variables take precedence.

| Variable                   | Default                                        | Effect                                                                                                            |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | Postgres on 127.0.0.1:5617 from `.env.example` | Prisma database connection.                                                                                       |
| `DB_PORT`                  | 5617                                           | Compose loopback port; match the port in `DATABASE_URL`.                                                          |
| `PORT`                     | 3115                                           | Demo server and CSV CLI port.                                                                                     |
| `AI_PROVIDER`              | mock                                           | `mock` produces deterministic drafts; `openai` selects the existing optional provider adapter.                    |
| `AI_API_KEY`               | empty                                          | Server-only key required by the optional OpenAI adapter. Never returned to the browser.                           |
| `AI_MODEL`                 | adapter default                                | Optional model for that adapter.                                                                                  |
| `SEND_MODE`                | manual                                         | Retained domain setting. The workspace has no delivery endpoint or send implementation, regardless of this value. |
| `FEEDBACK_CAPTURE_ENABLED` | true                                           | Exact value `false` rejects feedback writes with HTTP 403.                                                        |
| `FEEDBACK_DEFAULT_CHANNEL` | in_app                                         | Channel saved with feedback entries.                                                                              |

`npm run demo` forces `AI_PROVIDER=mock` and `SEND_MODE=manual` for its child processes. To deliberately exercise a configured provider, run the app using `npm run dev` or `npm run start` instead. The optional external adapter retains its unit coverage; no live calls are made by CI or the demo, and live service behavior has not been verified in this release.
