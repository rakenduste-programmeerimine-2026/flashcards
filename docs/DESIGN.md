# Design

The whole visual system is in `app/tokens.css`. `/design` renders it as a living reference, so
you can check a change in both themes without clicking through the product.

## What the design has to do

A student opens this app with a wall of pasted text and a test tomorrow. The interface should be
quiet, the term on a card should be the loudest thing on the screen, and nothing should compete
with it.

## Colour

Indigo `#3B35CC` is the single accent: actions, progress and the active step. Nothing else in the
app is allowed to be loud.

The neutrals are biased slightly towards that indigo rather than being pure grey, so the greys
look chosen instead of inherited. Page background is a cool light grey and cards sit on top of it
in white — the opposite of white-page-with-grey-cards, which makes a card feel like an object you
are holding.

`--color-good` and `--color-bad` are semantic only: "I knew it" and "I did not know", never
decoration. They are not variations of the accent, so a rating never looks like a primary action.

Dark mode is a separate palette, not an inversion: the background is a near-black with a blue
cast, and the accent lightens to `#9D97FF` so it still reads on a dark surface.

## Type

Three faces, each with one job:

| Face                | Role                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bricolage Grotesque | Display. Flashcard terms, page titles. It has enough character to carry a single word on an otherwise empty card. |
| Source Sans 3       | Body. Definitions and interface text, readable at 15–17px.                                                        |
| IBM Plex Mono       | Labels, counters and the prompt block.                                                                            |

The one recurring typographic device is the mono, letter-spaced, uppercase label (`.label` in
`globals.css`): step counters, card positions, deck sizes. It is the detail that makes the
interface look like a study tool rather than a generic web app — and the reason card counts and
scores use `font-variant-numeric: tabular-nums`, so digits do not shift while you practise.

Scale steps exist for the things this product actually has: a term on a card, a page title, a
deck name, a meaning, body text. There is no step without a use.

## Shape and space

Space is a 4px grid, `--space-1` to `--space-8`. Radii go from `--radius-sm` on small controls to
`--radius-xl`, which is used on the flashcard only.

Card styling is applied by role, not everywhere. One shadow exists, `--shadow-card`, and only the
flashcard gets it. Deck rows and panels use a border. If everything is a floating rounded card,
nothing is.

## Rules for every screen

1. No literal colour, size or radius in a component. If you need a value, add a token.
2. Readable line length for running text: `--measure` (62ch).
3. A 16px minimum side gutter at every width, written with `max()` so it clears a phone's side
   system bar.
4. Works between 360px and 1440px with no horizontal page scroll.
5. Both themes checked before a pull request, not after.
6. The focus ring from `globals.css` stays visible. Removing it without a replacement is a bug.
7. `prefers-reduced-motion` is respected globally.

## What we are deliberately not doing

The `ux: craft` label on the UI issues exists because the default look of an AI-assisted project
is recognisable: cream background with a serif display face and a terracotta accent, a
purple-to-blue gradient hero, Inter as the only typeface, emoji as section markers, everything
centred, and the same rounded card with the same shadow around every block.

We are not doing those. We are also not adding a utility CSS framework: the tokens are the system,
and CSS modules keep each component's styling next to it.
