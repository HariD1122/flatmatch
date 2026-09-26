# FlatMatch

Three friends are flat-hunting together. FlatMatch reads the latest "House Hunt"
Google Form responses, applies the group's must-have requirements, and shows the
top 3 addresses with a friendly reason and the trade-offs for each person. It
doesn't decide for you — it gives you options to discuss.

Live app: https://flatmatch-delta.vercel.app

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Gemini API for one-line reasons and a results-only chatbot
- Data source: a published Google Sheet CSV (linked from the Google Form), with a
  bundled sample dataset as a fallback

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in:

- `GEMINI_API_KEY` — server-side only, never exposed to the browser
- `GEMINI_MODEL` — defaults to `gemini-3.8-flash` if unset
- `SHEET_CSV_URL` — the published CSV link for the House Hunt responses sheet;
  leave empty to use the bundled sample data

## How matching works

1. **Data check** — rows with an implausible rent (below ₹5,000) or missing
   fields are flagged as "needs checking" and excluded from ranking.
2. **Must-have filter** — flats are removed if they fail a required rule (lift
   or ground floor, max distance to Hinjewadi, max distance to the gym). Flats
   that break exactly one rule are shown separately as "near misses".
3. **Scoring (0–100)** — 35% closeness to Hinjewadi, 35% closeness to the gym,
   15% rent (cheaper is better), 15% extras (parking, pet-friendly, 3+
   bathrooms, closeness to family).
4. **Ranking** — highest score wins; ties are broken by whichever flat makes
   the least-satisfied person happiest, then by lower rent.
5. **Output** — top 3 addresses, each with a reason, per-person trade-offs, and
   the full set of inputs used.

## Deployment

Pushes to `main` auto-deploy to Vercel production via the connected GitHub
repository.
