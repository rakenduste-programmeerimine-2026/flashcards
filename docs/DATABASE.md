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

## Local stack (needs Docker)

```bash
npx supabase start          # applies every migration to a fresh local database
npx supabase status         # URLs and the local keys
npx supabase db reset       # start over from the migrations
```

## Changing the schema

Never edit a migration that has already been pushed. Add a new one:

```bash
npx supabase migration new <what-it-does>
```

…write the SQL, check it with `npx supabase db reset` and the tests in `docs/TESTING.md`, and open
a pull request like any other change.
