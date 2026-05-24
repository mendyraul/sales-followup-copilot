# Environment Variables

Use `mock` + `manual` defaults for safe local development.

## Reference

| Variable | Required | Default | Example | Purpose |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | — | `postgresql://postgres:postgres@localhost:5432/sales_followup` | PostgreSQL connection string used by Prisma and app runtime. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | `Sales Follow-Up Copilot` | Branding value shown in UI. |
| `SEND_MODE` | No | `manual` | `manual` | Safety mode. Keep `manual` for MVP workflows; `test` only for controlled simulation. |
| `AI_PROVIDER` | No | `mock` | `mock` | AI provider adapter. `mock` avoids external API calls and keeps demos deterministic. |
| `AI_API_KEY` | Conditional | — | `sk-...` | Required only for non-`mock` providers. Leave empty when `AI_PROVIDER=mock`. |

## Recommended Local Values

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_followup"
NEXT_PUBLIC_APP_NAME="Sales Follow-Up Copilot"
SEND_MODE="manual"
AI_PROVIDER="mock"
AI_API_KEY=""
```

## Validation Checklist

- `DATABASE_URL` points at reachable Postgres
- `SEND_MODE` is `manual` unless actively running controlled tests
- `AI_PROVIDER=mock` for local development
- `.env` is never committed

## Troubleshooting

- **Prisma connect errors**: verify DB container is running and `DATABASE_URL` host/port are correct.
- **Unexpected external calls**: ensure `AI_PROVIDER=mock` and `AI_API_KEY` is empty.
