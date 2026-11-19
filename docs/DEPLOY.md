# Deployment (issue #33)

**Live app:** https://flashcards-sigma-two.vercel.app

The app runs on [Vercel](https://vercel.com) (project `flashcards`) against the hosted Supabase
project from [DATABASE.md](DATABASE.md). The local stack is never used for the deployed app.

## Environment variables

Set in Vercel → Project → Settings → Environment Variables, for Production, Preview and
Development. Nothing is committed; `.env.example` only names them.

| Name                            | Value                                             |
| ------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | The hosted project URL (Project Settings → API)   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The publishable key (Project Settings → API keys) |

Both are browser values: row level security protects the data, not the key. The service role
(secret) key and the database password are **not** used by the app and must never be added here.

## Supabase settings for the deployed domain

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://flashcards-sigma-two.vercel.app`
- **Redirect URLs:** `https://flashcards-sigma-two.vercel.app/**`, `http://localhost:3000/**`,
  and, once preview deployments are on, `https://flashcards-*-martsutts-projects.vercel.app/**`

## Deploying

### From the command line (how it is done now)

Needs a Vercel account with access to the project.

```bash
npx vercel@latest login
npx vercel@latest link --yes --project flashcards   # once per clone, writes .vercel/ (gitignored)
npx vercel@latest deploy --prod                     # builds on Vercel and updates the live URL
```

`vercel link` also writes a `.env.local` with a Vercel token. If you had your own `.env.local`,
copy the values from `.env.example` back into it, or run `npx vercel@latest env pull`.

### From GitHub (preview URL for every pull request)

Vercel's GitHub integration deploys `main` on every merge and gives each pull request its own
preview URL. It needs the Vercel GitHub App on the `rakenduste-programmeerimine-2026`
organization, which only an organization owner can approve. The request was sent on
19 November. When it is approved: Vercel → Project → Settings → Git → Connect Git Repository →
`rakenduste-programmeerimine-2026/flashcards`.

## Checking a deployment

Run [JOURNEY-CHECKLIST.md](JOURNEY-CHECKLIST.md) on the live URL, on a phone and on a desktop
browser, and keep the results table.
