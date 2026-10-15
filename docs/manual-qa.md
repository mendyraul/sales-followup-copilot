# Manual QA checklist

Use this checklist before demos, branch promotion, or any live-send experiment.

## Environment safety
- Confirm `.env` keeps `SEND_MODE=manual`.
- Use `AI_PROVIDER=mock` unless you are intentionally validating a real provider.
- Do not load production secrets for normal QA runs.

## App startup
1. Install deps: `npm ci`
2. Start the app: `npm run dev`
3. Open `http://localhost:3000`
4. Confirm the dashboard loads without runtime errors and the **Safety mode** card says `manual`.

## Dashboard checks
- Queue ordering stays `Pat Rivera` -> `Jordan Lee` -> `Avery Smith`.
- Queue cards show a visible recommended action plus a `Next step:` follow-up-stage hint for each lead.
- First follow-up draft preview shows tone, objective source, context sources, any missing review inputs, and warning banners when the draft falls back to generic assumptions.
- Audit log shows recent lead/draft/feedback/system events.
- Timeline cards show a latest note preview and newest-first history.
- CSV preview shows 4 valid rows, 1 blocked row, and the duplicate `jordan@example.com` warning.

## Regression commands
```bash
npm test -- --run
npm run build
```

## If something fails
- Capture the failing page section or command output.
- Keep outbound delivery disabled while investigating.
- Update the related issue/PR with the exact failing checkpoint.
