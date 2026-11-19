# Database

Supabase (Postgres) with two tables, `decks` and `cards`, and row level security on both. The
schema lives in `supabase/migrations/`; nobody changes tables by hand in the dashboard.

| Table   | What it holds                                                               |
| ------- | --------------------------------------------------------------------------- |
| `decks` | One row per deck: owner, name, language (`et` or `en`), created and updated |
| `cards` | Term, meaning, a gapless position 0..n-1 inside the deck, practice counters |

A user sees and changes only their own decks; a card belongs to whoever owns its deck. The
writes that touch several rows (a deck with its cards, moving or deleting a card, recording a
batch of practice ratings) are Postgres functions, so each one is a single transaction.

## Set up the hosted project (once, issue #3)

1. Create a free project at [supabase.com](https://supabase.com). Region: Frankfurt
   (`eu-central-1`), closest to Tallinn. Keep the database password in a password manager, not
   in the repository or in chat.
2. **Authentication → Sign In / Providers:** Email is on. For the user test, decide with the team
   whether "Confirm email" stays on (safer) or is switched off (fewer steps for the contact).
3. **Authentication → URL Configuration:** set the Site URL to the deployed address, and add
   `http://localhost:3000/**` to the redirect URLs.
4. Apply the migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   Without the CLI: open **SQL Editor** and run each file in `supabase/migrations/` in name order.

5. **Project Settings → API:** copy the URL and the anon (publishable) key into `.env.local`
   (see `.env.example`) and into the Vercel project's environment variables.
6. Share access with the team through **Organization → Team**, not by sharing a password.

## Local stack (issue #39)

Every member develops against their own database on their own machine. The hosted project is
only touched by the deploy (#33), so nobody's migration or test run breaks the others' work.

**Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) running. The
Supabase CLI itself is a dev dependency, so `npm install` gives everyone the same version.

```bash
cp .env.example .env.local   # already points at the local stack
npm run db:start             # first run downloads the images (a few minutes)
npm run dev                  # http://localhost:3000
```

Sign in with **demo@flashcards.local / demo-password**. That user and a demo deck of twelve cards
come from `supabase/seed.sql`.

| Script              | What it does                                                           |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run db:start`  | Starts the stack and prints the API URL, Studio URL and local keys     |
| `npm run db:stop`   | Stops it and keeps the data                                            |
| `npm run db:reset`  | Rebuilds the database from `supabase/migrations/` plus the seed        |
| `npm run db:status` | Prints the URLs and keys again                                         |
| `npm run db:diff`   | Shows SQL for changes made by hand in Studio, to turn into a migration |

The ports are fixed in `supabase/config.toml`, so everyone has the same URLs:

| Service         | URL                                                     |
| --------------- | ------------------------------------------------------- |
| API             | http://127.0.0.1:54321                                  |
| Database        | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio          | http://127.0.0.1:54323                                  |
| Email (Mailpit) | http://127.0.0.1:54324                                  |

**A port is already taken?** Usually another Supabase project is still running. Stop it with
`npx supabase stop --project-id <its-id>`, or everything with `npx supabase stop --all`. If a
different program owns the port, stop that program; do not change the ports in `config.toml`,
because then the URLs in `.env.example` and in this file stop matching for the rest of the team.

**Local or hosted?**

| Flow                               | Database                            |
| ---------------------------------- | ----------------------------------- |
| `npm run dev`, trying out a change | Local                               |
| `npm test`, `npm run test:db`      | Local (never the hosted project)    |
| CI on a pull request               | A throwaway Postgres inside the job |
| The deployed app, the user test    | Hosted, set in Vercel (#33)         |

The local keys in `.env.example` are the Supabase CLI's defaults for every local stack and are
not secrets. No hosted key belongs in the repository.

## Changing the schema

Never edit a migration that has already been pushed. Add a new one:

```bash
npx supabase migration new <what-it-does>
```

…write the SQL, check it with `npx supabase db reset` and the tests in `docs/TESTING.md`, and open
a pull request like any other change.
