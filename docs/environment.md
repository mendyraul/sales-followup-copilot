# Environment Variable Guide

This project is designed to run safely in **manual/test mode** by default.

## Variables

| Variable | Required | Example | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/sales_followup` | Used by Prisma and runtime DB access. |
| `NEXT_PUBLIC_APP_NAME` | No | `Sales Follow-Up Copilot` | Optional app display name for client UI. |
| `SEND_MODE` | Yes | `manual` | Keep as `manual` for development safety. |
| `AI_PROVIDER` | Yes | `mock` | Keep `mock` to avoid live API calls in local/dev. |
| `AI_API_KEY` | Conditional | `sk-...` | Only needed if `AI_PROVIDER` is not `mock`. |

## Recommended profiles

| Profile | SEND_MODE | AI_PROVIDER | AI_API_KEY |
|---|---|---|---|
| Local development | `manual` | `mock` | empty |
| Staging validation | `manual` | real provider name | staging key |
| Production (future) | `manual` until explicitly approved | real provider name | production key |


### Local development (safe default)
```env
SEND_MODE=manual
AI_PROVIDER=mock
AI_API_KEY=
```

### Staging validation (still manual-safe)
```env
SEND_MODE=manual
AI_PROVIDER=<real-provider>
AI_API_KEY=<staging-key>
```

## Troubleshooting

- **Prisma connection errors**: verify `DATABASE_URL`, then run `docker compose up -d db`.
- **App starts but AI draft fails**: if `AI_PROVIDER` is real, verify `AI_API_KEY` is set.
- **Unexpected outbound behavior**: confirm `SEND_MODE=manual` in the active environment.

## Security

- Do not commit `.env` with real credentials.
- Rotate any key immediately if it is exposed.
- Prefer separate keys per environment.
