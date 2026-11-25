# Journey checklist (issue #34)

A manual walk through the main user journey, run on the **deployed** app before the user test
and again after every change that touches it. Fill in a new results table for each run; keep
the old ones, they are the evidence.

**Success criterion (agreed with the contact):** a user makes at least 10 cards from their own
material and studies them.

## Before you start

- [ ] The deployed URL opens (#33). Write it here: `________`
- [ ] The Supabase project has the migrations from #70 and #72 applied (Table Editor shows
      `decks` and `cards`).
- [ ] A test user exists (Supabase → Authentication → Users). There is no sign-up page, so users
      are created there with "Auto Confirm User".
- [ ] Phone (about 400px) and desktop browser ready.

## The journey

| #   | Step                                                                 | Expected                                                                 |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Open the home page                                                   | The prompt page with the ready-made prompt and a copy button             |
| 2   | Press the copy button                                                | The prompt is on the clipboard, the button confirms it                   |
| 3   | Paste the prompt and real study material (12+ terms) into an AI chat | The AI answers in the `1. MÕISTE: … 1) TÄHENDUS: …` format               |
| 4   | Copy the whole AI answer, open the paste screen, paste it            | A preview lists every card; badly formatted lines are reported, not lost |
| 5   | Give the deck a name and save                                        | Asked to sign in if there is no session; after sign-in the deck is saved |
| 6   | Open the deck list                                                   | The new deck is first, with the right card count                         |
| 7   | Start practice                                                       | Cards in random order, the meaning hidden                                |
| 8   | Reveal, mark "I knew it" / "I did not know" through the whole round  | The round summary shows the counts and offers the missed cards again     |
| 9   | Edit one card, add one, delete one                                   | Changes stay after a page reload                                         |
| 10  | Switch the language ET ↔ EN                                          | Every screen is translated                                               |
| 11  | Sign out, sign in as a second test user, open the deck list          | The first user's deck is **not** visible                                 |
| 12  | Paste 0 cards, an empty name, or a 300-character term                | A clear error, nothing saved                                             |

## Results

Copy this table for every run.

**Run:** date `____` · tester `____` · URL `____` · device `____`

| #   | Pass / fail | Notes (what happened, screenshot link) |
| --- | ----------- | -------------------------------------- |
| 1   |             |                                        |
| 2   |             |                                        |
| 3   |             |                                        |
| 4   |             |                                        |
| 5   |             |                                        |
| 6   |             |                                        |
| 7   |             |                                        |
| 8   |             |                                        |
| 9   |             |                                        |
| 10  |             |                                        |
| 11  |             |                                        |
| 12  |             |                                        |

**Success criterion met?** yes / no, and why: `____`

## Notes

- Sign-in is on `/sign-in` (#79). Saving a deck while signed out offers "Sign in and save"; the
  pasted answer is kept in the tab and comes back after sign-in.
- Step 11 is also covered by the automated checks in `supabase/tests/rls.test.ts` (#71), so a
  failure here and a pass there points at the app, not the database.
