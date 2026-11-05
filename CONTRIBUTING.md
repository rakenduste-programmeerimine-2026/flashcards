# Contributing

Three people work in this repository for two weeks. These rules exist so that nobody loses work
and so that `main` always runs.

## The rule that matters most

**One update → one issue → one branch → one pull request.**

No pull request without an issue. No issue closed without a pull request. If you discover extra
work while you are in a branch, open a new issue for it instead of widening the branch.

## Branches

`main` is protected: no direct pushes, no force pushes. Every change arrives through a pull
request.

Branch names are `<type>/<issue-number>-<short-subject>`:

```
feat/23-practice-shuffle
fix/36-feedback-improvement
chore/2-next-scaffold
docs/1-project-docs
test/20-rls-checks
ci/9-github-actions
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`.

Branch from an up-to-date `main`:

```bash
git switch main
git pull
git switch -c feat/23-practice-shuffle
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), written in English, in the
imperative mood:

```
<type>(<scope>): <what the commit does>
```

```
feat(practice): shuffle the deck when a session starts
fix(import): keep meanings that wrap onto several lines
chore(setup): add prettier config
test(db): add cross-account policy checks
docs(readme): add the setup commands
```

Rules:

- The subject line stays under 72 characters and has no full stop at the end.
- Scope is the area touched: `practice`, `import`, `api`, `db`, `ui`, `i18n`, `auth`, `setup`.
- One commit does one thing. Do not mix a refactor into a feature commit.
- Reference the issue in the body when it helps: `Refs #23`.
- Never commit secrets, `.env.local`, or anything from a recorded feedback session.

## Pull requests

- Title uses the same Conventional Commit format as the commits.
- The description ends with `Closes #<issue>` so the issue closes on merge.
- Fill in the pull request template: what changed, how it was checked, screenshots for UI work.
- One approving review from another team member before merging. Review each other's work
  across roles; it is the only way all three of us can explain the whole app at the presentation.
- Lint, typecheck and build have to pass.
- Squash merge, then delete the branch.
- Keep a pull request small enough that a teammate can review it in fifteen minutes.

## Issues

Every issue carries:

- a **role** label — `role: frontend`, `role: backend`, `role: database` or `role: team`;
- a **type** label — `type: feature`, `type: fix`, `type: chore`, `type: docs`, `type: test`, `type: ci`;
- a **priority** label — `prio: must` or `prio: should`;
- a **milestone**, which is the cycle it belongs to.

Frontend issues that produce something visible also carry `ux: craft`. That label means the
screen has to look like a product somebody designed. It must not look like generic AI output:
no default template look, no cream-and-serif or purple-gradient cliché, no emoji as section
markers, no placeholder copy. Use the design tokens, include at least one detail that only a
flashcard app would have, and show the result in the pull request.

## Working agreement

- Move your issue on the board when you start it and when you open the pull request.
- Push at least once a day so the others can see where you are.
- If you are blocked for more than an hour, say so in the issue instead of waiting.
- AI-assisted code is allowed, but you have to be able to explain every line you merge. If you
  cannot explain it, do not merge it.
