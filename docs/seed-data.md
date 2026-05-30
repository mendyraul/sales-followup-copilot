# Seed / Demo Data

This project includes a manual-safe demo seed helper in `lib/demoSeed.ts`.

## Purpose
- Provide realistic records for UI walkthroughs and manual QA.
- Keep default behavior safe (no external sending side effects).

## Usage
```ts
import { getDemoLeads } from '../lib/demoSeed';

const demoLeads = getDemoLeads();
```

## Data shape
Each demo lead includes:
- `name`
- `company`
- `email`
- `stage` (`new|contacted|qualified|proposal|won|lost`)
- `lastContactedAt` (ISO timestamp)
- optional `notes`

## Validation
Unit test coverage is in `lib/demoSeed.test.ts` and checks:
- minimum record count
- valid field structure
- defensive copying behavior
