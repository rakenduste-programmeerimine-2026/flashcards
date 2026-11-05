# Flashcards

Turn an AI answer into a practice deck. A student copies a ready-made prompt into their own
AI chat together with their study material, pastes the answer back here, and gets flashcards
they can practise in random order.

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

The database comes next: the local Supabase stack is issue #39 and the full step-by-step guide
is issue #40 (`docs/SETUP.md`).

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

## Project status

Planning is done: 37 issues across four cycles, each with a role and acceptance criteria.
Development starts with [#2](../../issues/2).
