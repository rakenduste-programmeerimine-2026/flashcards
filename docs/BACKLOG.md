# Backlog

37 issues in four cycles. The board below is the working view; the tables are the
planning view. GitHub issues are the source of truth — if the two disagree, the issue wins.

## Kanban board

Columns on the project board:

| Column          | What it means                                           | Who moves it there                     |
| --------------- | ------------------------------------------------------- | -------------------------------------- |
| **Backlog**     | Written, has a role and a cycle, not started            | Whoever writes the issue               |
| **Ready**       | Its dependencies are merged, it can be picked up today  | Whoever merged the last dependency     |
| **In progress** | A branch exists and work is happening                   | The owner, when they create the branch |
| **In review**   | A pull request is open and waiting for a review         | The owner, when they open the PR       |
| **Done**        | Squash-merged into `main`, branch deleted, issue closed | Closed automatically by `Closes #n`    |

Working rules:

- **Two cards per person in "In progress".** If you are blocked, the card goes back to Ready with a comment, it does not sit open.
- A card only reaches **Ready** when every issue in its "Depends on" list is closed.
- A card in **In review** for more than a day is somebody's job to review that day.
- Nothing moves to **Done** by hand. The pull request closes the issue.

## Role split

| Role               | Issues | Owner     |
| ------------------ | ------ | --------- |
| Frontend & UX      | 17     | _fill in_ |
| Backend & security | 7      | _fill in_ |
| Database & quality | 8      | _fill in_ |
| Whole team         | 5      | shared    |

Frontend carries the most work, which is expected for this product: the value is in the
screens. The two `prio: should` frontend items are the ones that move first if a cycle slips.

## Cycle 1 — Foundation

**5–8 November** — A real but empty app all three of us can work in.

| #                      | Issue                                                                       | Role     | Type                  | Priority | Branch                   |
| ---------------------- | --------------------------------------------------------------------------- | -------- | --------------------- | -------- | ------------------------ |
| [1](../../../issues/1) | docs(repo): project README, backlog, timeline and git conventions           | Team     | docs                  | must     | `docs/1-project-docs`    |
| [2](../../../issues/2) | chore(setup): scaffold the Next.js app with TypeScript, ESLint and Prettier | Frontend | chore                 | must     | `chore/2-next-scaffold`  |
| [3](../../../issues/3) | chore(db): create the Supabase project, keys and environment example        | Database | chore                 | must     | `chore/3-supabase-setup` |
| [4](../../../issues/4) | feat(ui): design system — colour tokens, type scale and dark mode           | Frontend | feature · `ux: craft` | must     | `feat/4-design-system`   |
| [5](../../../issues/5) | feat(ui): app shell with header, navigation and designed empty states       | Frontend | feature · `ux: craft` | must     | `feat/5-app-shell`       |
| [6](../../../issues/6) | feat(i18n): Estonian and English dictionaries with a language switch        | Frontend | feature               | must     | `feat/6-i18n-foundation` |
| [7](../../../issues/7) | feat(db): decks and cards tables with row level security                    | Database | feature               | must     | `feat/7-db-schema`       |
| [8](../../../issues/8) | feat(auth): Supabase email sign-in, session handling and protected routes   | Backend  | feature               | must     | `feat/8-auth`            |
| [9](../../../issues/9) | ci(quality): GitHub Actions workflow for lint, typecheck and build          | Database | ci                    | should   | `ci/9-github-actions`    |

## Cycle 2 — Cards from an AI answer

**9–12 November** — The main user journey, end to end. The midpoint demo comes from this cycle.

| #                        | Issue                                                                       | Role     | Type                  | Priority | Branch                     |
| ------------------------ | --------------------------------------------------------------------------- | -------- | --------------------- | -------- | -------------------------- |
| [10](../../../issues/10) | feat(prompt): prompt page with the ready-made prompt and a copy button      | Frontend | feature · `ux: craft` | must     | `feat/10-prompt-page`      |
| [11](../../../issues/11) | feat(prompt): Estonian and English prompt text plus a JSON variant          | Frontend | feature               | must     | `feat/11-prompt-variants`  |
| [12](../../../issues/12) | feat(import): parser for the TERM / MEANING text format                     | Frontend | feature               | must     | `feat/12-parser-text`      |
| [13](../../../issues/13) | feat(import): parser support for the JSON answer format                     | Frontend | feature               | should   | `feat/13-parser-json`      |
| [14](../../../issues/14) | feat(import): paste screen with a preview of the parsed cards before saving | Frontend | feature · `ux: craft` | must     | `feat/14-paste-screen`     |
| [15](../../../issues/15) | feat(api): validation schemas for deck and card input                       | Backend  | feature               | must     | `feat/15-input-validation` |
| [16](../../../issues/16) | feat(api): create a deck with its cards in one request                      | Backend  | feature               | must     | `feat/16-api-create-deck`  |
| [17](../../../issues/17) | feat(api): list, rename and delete decks                                    | Backend  | feature               | must     | `feat/17-api-deck-crud`    |
| [18](../../../issues/18) | feat(db): deck and card queries with counts in one round trip               | Database | feature               | must     | `feat/18-db-queries`       |
| [19](../../../issues/19) | feat(decks): deck list page connected to the API                            | Frontend | feature               | must     | `feat/19-deck-list`        |
| [20](../../../issues/20) | test(db): row level security checks for decks and cards                     | Database | test                  | must     | `test/20-rls-checks`       |
| [21](../../../issues/21) | docs(demo): midpoint walkthrough of one end-to-end feature                  | Team     | docs                  | must     | `docs/21-midpoint-demo`    |

## Cycle 3 — Practice, editing and two languages

**13–16 November** — Everything the contact asked for is in the product. Feature freeze at the end.

| #                        | Issue                                                                       | Role     | Type                  | Priority | Branch                         |
| ------------------------ | --------------------------------------------------------------------------- | -------- | --------------------- | -------- | ------------------------------ |
| [22](../../../issues/22) | feat(practice): practice session that hides and reveals the meaning         | Frontend | feature · `ux: craft` | must     | `feat/22-practice-session`     |
| [23](../../../issues/23) | feat(practice): shuffle the cards into a random order when a session starts | Frontend | feature               | must     | `feat/23-practice-shuffle`     |
| [24](../../../issues/24) | feat(practice): reshuffle the remaining cards during a session              | Frontend | feature               | should   | `feat/24-practice-reshuffle`   |
| [25](../../../issues/25) | feat(practice): round summary with a repeat-the-missed-cards flow           | Frontend | feature               | must     | `feat/25-round-summary`        |
| [26](../../../issues/26) | feat(editor): edit, add and delete cards in a deck                          | Frontend | feature · `ux: craft` | must     | `feat/26-card-editor`          |
| [27](../../../issues/27) | feat(api): update and delete single cards                                   | Backend  | feature               | must     | `feat/27-api-card-crud`        |
| [28](../../../issues/28) | feat(db): store the practice result per card                                | Database | feature               | should   | `feat/28-practice-results`     |
| [29](../../../issues/29) | feat(api): record a practice rating with per-user access checks             | Backend  | feature               | should   | `feat/29-api-practice-results` |
| [30](../../../issues/30) | feat(i18n): every screen available in Estonian and English                  | Frontend | feature               | must     | `feat/30-i18n-complete`        |
| [31](../../../issues/31) | feat(api): size limits and basic rate limiting on write endpoints           | Backend  | feature               | should   | `feat/31-write-limits`         |

## Cycle 4 — User test, polish and submission

**17–18 November** — Recorded feedback, the improvement it produces, deployment and the submission.

| #                        | Issue                                                                                | Role     | Type    | Priority | Branch                        |
| ------------------------ | ------------------------------------------------------------------------------------ | -------- | ------- | -------- | ----------------------------- |
| [32](../../../issues/32) | feat(a11y): keyboard support, focus order and contrast pass                          | Frontend | feature | should   | `feat/32-accessibility-pass`  |
| [33](../../../issues/33) | chore(deploy): deploy to Vercel with the production Supabase settings                | Database | chore   | must     | `chore/33-deploy`             |
| [34](../../../issues/34) | test(journey): manual checklist for the main user journey                            | Database | test    | must     | `test/34-journey-checklist`   |
| [35](../../../issues/35) | docs(user-test): recorded feedback session with the contact and a summary            | Team     | docs    | must     | `docs/35-user-test`           |
| [36](../../../issues/36) | fix(feedback): the one improvement the contact asked for                             | Team     | fix     | must     | `fix/36-feedback-improvement` |
| [37](../../../issues/37) | docs(submission): setup instructions, contribution evidence and submission checklist | Team     | docs    | must     | `docs/37-submission`          |

## Out of scope for Project 1

Written down so we stop re-discussing them:

- Connecting to an AI provider from the app. The whole point is that the student uses their own chat.
- Spaced repetition scheduling. We store practice results ([#28](../../../issues/28)) but we do not schedule reviews.
- Sharing or publishing decks between users.
- Images, audio or file upload on a card.
- Importing from Quizlet or Anki.

If the contact asks for one of these in the feedback session, it becomes a Project 2 idea,
not a Cycle 4 change.
