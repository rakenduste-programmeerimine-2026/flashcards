# Testing

What has been checked, how, and what is left for a person to do.

## Accessibility pass — 12 November (issue #32)

Checked on `/`, `/paste`, `/decks`, `/decks/:id/practice` and `/decks/:id/edit`, in both themes
and both languages, at 400px and 1100px.

### Contrast

`npm run check:contrast` computes the WCAG ratio for every token pair the interface actually puts
together, reading `app/tokens.css` so it checks what ships rather than a copy of the palette in a
document that drifts. It runs as part of `npm run build`.

**Finding.** All text passed AA in both themes on the first run — the lowest was an error sentence
on the page background at 4.75:1 (light). What failed was borders: `--color-line` against a card
is 1.43:1 in light and 1.34:1 in dark, well under the 3:1 that WCAG 1.4.11 asks of anything you
need to see in order to find a control.

**Fix.** A second token, `--color-control`, for borders that carry meaning — fields, buttons, the
two segmented switches, the shuffle switch, the step dots. `--color-line` stays quiet and keeps
its job as a separator between blocks, where no rule applies because nothing is identified by it.

| Pair                           | Light           | Dark            | Needs |
| ------------------------------ | --------------- | --------------- | ----- |
| Body text on the page          | 15.42:1         | 16.31:1         | 4.5   |
| Secondary text on a card       | 5.95:1          | 6.94:1          | 4.5   |
| Label on a primary button      | 8.18:1          | 7.35:1          | 4.5   |
| "I knew it" / "I did not know" | 4.96:1 / 5.62:1 | 9.58:1 / 8.03:1 | 4.5   |
| A field or control on a card   | 3.66:1          | 4.75:1          | 3     |
| The focus ring on the page     | 6.91:1          | 7.63:1          | 3     |

Full output: `npm run check:contrast`.

### Focus order

Tabbed from the top of each screen, recording what received focus and whether the ring was
visible.

Every screen starts with the skip link, then the wordmark, the language switch and the three
steps, then the content in the order it is read. Nothing traps focus; tabbing past the last
control wraps to the browser chrome and back to the skip link. The focus ring from `globals.css`
was present on every control.

**Finding.** The prompt block is `tabIndex={0}` so it can be scrolled from the keyboard, which
means a screen reader lands on it — and it had no name.

**Fix.** It is now `role="region"` with `aria-labelledby` pointing at the _Juhend_ heading above
it.

**Finding, from #55.** The practice key handler ignored keys whose target was a button. That was
fine while every button unmounted after being clicked, but the reshuffle button stays, so focus
stayed on it and the next Space pressed it again instead of revealing — the keyboard was dead for
the rest of the round.

**Fix.** Reshuffling moves focus to the card that changed, which is also what a screen reader
user needs. Fixed in #55 rather than here.

**Not a finding:** save and discard in the editor are missing from the tab order until something
has changed. They are `disabled` while there is nothing to save, which is correct.

### Announcements

- Revealing a meaning updates an `aria-live="polite"` line that says whether the meaning is hidden
  or shown; the meaning itself is not in the document until it is revealed.
- The reshuffle confirmation, the copy result on the prompt page, the save state in the editor and
  the loading state all use `role="status"`.
- Deleting a deck opens a `role="alertdialog"` inside the row, named with the deck's own name, and
  focus goes to _Jäta alles_ rather than to the destructive button.
- The current step carries `aria-current="step"` and a screen-reader-only ", praegune samm".
- Progress during practice is a real `role="progressbar"` with `aria-valuenow`.

### Motion

`prefers-reduced-motion: reduce` is honoured globally in `globals.css`. Checked with the media
feature emulated: the progress meter's transition drops to effectively zero and the loading
skeleton stops sweeping.

### Second opinion

Lighthouse (mobile, navigation mode) on `/` and `/paste`: **accessibility 100, 52 audits passed,
0 failed** on both.

### Still to do by a person

- **A real screen reader.** Everything above is automated probing plus Lighthouse. NVDA or
  VoiceOver on one full round of practice is a different test and nobody has run it yet.
- **A native Estonian reader on the product copy**, which is also the open item in #30.

## Keyboard reference

A full practice round needs no mouse:

| Key          | What it does                                |
| ------------ | ------------------------------------------- |
| Space, Enter | Shows the meaning                           |
| Right arrow  | I knew it                                   |
| Left arrow   | I did not know                              |
| Tab          | Moves through the controls in reading order |

The keys are shown under the buttons during practice, so they do not have to be discovered here.
