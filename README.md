# Flashcards

Turn an AI answer into a practice deck. A student copies a ready-made prompt into their own
AI chat together with their study material, pastes the answer back here, and gets flashcards
they can practise in random order.

**Live app:** https://flashcards-sigma-two.vercel.app (deployment: [docs/DEPLOY.md](docs/DEPLOY.md))

The AI is never connected to this app. The study material stays on the student's own computer;
only the finished answer is pasted in.

## The problem

> "In history there are so many small details and terms to memorise. I normally use flashcards,
> but making them takes so long that I get nothing out of it."
> — our contact, a history student

Writing cards by hand is the part that costs the time, so the material never gets practised.

## Intended user

Students at school and university who have to memorise terms and definitions for a test or an
exam, and who already use flashcards but give up on making them.

## Success criterion

A student can go from study material to a saved, practisable deck without writing a single
card by hand, in under five minutes.

## Core features

1. **Copy the prompt.** A ready-made prompt in Estonian and English that makes any AI return
   terms and meanings in a fixed format.
2. **Create cards from the pasted answer.** The answer is parsed into cards, previewed, saved
   as a deck, and can be corrected afterwards in the card editor.
3. **Practise.** The deck is shuffled, the meaning stays hidden until it is revealed, every card
   is rated, and the cards that were missed come back in a second round.

Both languages, Estonian and English, are available across the whole interface.

## Stack

| Layer             | Choice                                      |
| ----------------- | ------------------------------------------- |
| Frontend          | Next.js (App Router), TypeScript            |
| Backend           | Next.js route handlers                      |
| Database and auth | Supabase (Postgres with row level security) |
| Hosting           | Vercel                                      |

## Team and roles

One person per role for Project 1.

| Role               | Responsibility                                           | Member    |
| ------------------ | -------------------------------------------------------- | --------- |
| Frontend & UX      | Pages, components, styling, wiring the UI to the API     | _fill in_ |
| Backend & security | Route handlers, logic, validation, access checks         | _fill in_ |
| Database & quality | Supabase schema and policies, queries, tests, deployment | _fill in_ |

## Setup

Node 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in the Supabase URL and key. Creating the Supabase
project, applying the migrations and the local stack are in [`docs/DATABASE.md`](docs/DATABASE.md).
The full step-by-step guide is issue #40 (`docs/SETUP.md`).

| Script                 | What it does                      |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Development server with Turbopack |
| `npm run build`        | Production build                  |
| `npm run start`        | Serve the production build        |
| `npm run lint`         | ESLint                            |
| `npm run typecheck`    | TypeScript with no emit           |
| `npm run format`       | Prettier, writes changes          |
| `npm run format:check` | Prettier, check only              |

Never commit `.env.local`. `.env.example` holds placeholder values only.

## Limits

The API refuses work above these numbers so one paste or one script cannot fill the database or
hang the app. They are a team assumption, defined in `lib/validation/limits.ts`; change them there
and every endpoint follows. Normal use is far below all of them: a 40-card import is about 4 KB
and one write.

| What                                         | Limit                                     | When it is hit                                    |
| -------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Body of the import route (`POST /api/decks`) | 512 KB                                    | `413 too_large`, nothing is read                  |
| Body of every other write route              | 64 KB                                     | `413 too_large`                                   |
| Cards in one import                          | 200                                       | `400 invalid_input`, `too_many`                   |
| Cards in one deck                            | 500                                       | `409 card_limit_reached`                          |
| Decks per user                               | 50                                        | `409 deck_limit_reached`                          |
| Writes per user                              | 120 per minute, all write routes together | `429 rate_limited`, with `Retry-After` in seconds |
| Ratings in one practice request              | 500                                       | `400 invalid_input`, `too_many`                   |

Reads (`GET`) are not rate limited. The rate limit counts in the memory of one server instance, so
on a serverless host the real limit can be higher and the counts reset when an instance is
recycled. It is there to stop a runaway client, not to enforce a quota. Every error is a stable
code the frontend translates; see [docs/API.md](docs/API.md).

## Project layout

```
app/           routes and pages (App Router)
components/    React components, one folder per area
lib/           Supabase clients, data access, parsing, i18n helpers
messages/      translation dictionaries, one file per locale
docs/          planning, design and setup documentation
```

## Documentation

| Document                             | What is in it                                               |
| ------------------------------------ | ----------------------------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md)   | Branch names, commit format, one issue one PR, review rules |
| [docs/BACKLOG.md](docs/BACKLOG.md)   | The Kanban board and the full backlog by cycle and role     |
| [docs/TIMELINE.md](docs/TIMELINE.md) | The four cycles, the midpoint demo and the deadline         |
| [docs/DATABASE.md](docs/DATABASE.md) | Supabase setup, the local stack and schema changes          |
| [docs/DEPLOY.md](docs/DEPLOY.md)     | The live URL, Vercel settings and how to deploy             |

## Project status

Planning is done: 37 issues across four cycles, each with a role and acceptance criteria.
Development starts with [#2](../../issues/2).
