# Style guide

How Peer Review looks, and which token to use where. The tokens live in
`src/styles/tokens.css`; this file says when to use each one. The approved mockups are in
the Claude Design canvas "Peer Review design directions" (Screens page), and the
references behind them are in `docs/design/references/`.

The direction is "old internet", styled after `docs/design/references/mockups-1.webp`:
one monospace family, paper and ink, hairline rules instead of boxes and shadows, and
underlined ink links. No photos (ADR 0005), so type, rules, and spacing carry every page.

## Color

Light mode only for now. A dark mode is a later task, with its own pairs added to the
contrast test.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--color-page` | #F2F0EB | Page background | |
| `--color-text` | #191816 | Body text, headings, links, solid buttons, strong rules | 15.58:1 on page, 17.00:1 on field |
| `--color-text-muted` | #5D5A54 | Dates, counts, help text, "logged", secondary links | 6.03:1 on page, 6.58:1 on field |
| `--color-rule` | #D3CFC6 | Lines between rows, sub-rating cell borders | Decorative, 1.36:1 |
| `--color-rule-strong` | `--color-text` | Under the header and over each section | |
| `--color-control-border` | #86827A | Input borders, empty star outlines, unpressed toggle buttons | 3.36:1 on page, 3.67:1 on field |
| `--color-field` | #FBFAF7 | Background of inputs and text areas, open menus | |
| `--color-placeholder-block` | #E2DFD8 | Grey blocks in loading fallbacks | Decorative, 1.17:1 |
| `--color-danger` | #8A2A1E | Destructive actions only ("Delete log") | 7.59:1 on page, 8.28:1 on field |
| `--color-button-text` | `--color-page` | Text on a solid ink button | 15.58:1 |

Rules:
- Never write a color in a CSS Module or inline. Use a token, or add one here first.
- Text reaches 4.5:1 and control borders 3:1 (WCAG 2.1 AA). `src/styles/tokens.test.ts`
  checks every pair above, so a token change that breaks contrast fails `npm test`.
- Rules and placeholder blocks are decorative. Nothing a user must read or find depends on
  them.
- No accent color. Links and actions are ink. Color is reserved for danger.

## Type

One family: IBM Plex Mono, loaded with `next/font` in `src/app/layout.tsx` and
self-hosted at build time. Two weights: 400 for everything, 500 for the wordmark, button
labels, and section labels.

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 11px | Uppercase section labels, sub-rating cell labels |
| `--text-sm` | 13px | Dates, counts, help text, meta rows |
| `--text-base` | 15px | Body, reviews, form fields |
| `--text-md` | 17px | Night names in lists, phone wordmark |
| `--text-lg` | 20px | Desktop wordmark, the night on a log or form |
| `--text-xl` | 22px | Page titles on phones |
| `--text-2xl` | 28px | Page titles on desktop |

- Headings are weight 400. Size sets the hierarchy, not weight.
- Body line height is `--leading-body` (1.6). Headings use `--leading-tight` (1.25).
- Reviews stay under 80 characters a line (about 640px at 15px).
- Uppercase labels (`--tracking-label`, weight 500, `--text-xs`) go only on a page's fixed
  sections: LINEUP, LOGS, COMMENTS, TOP VENUES, the date groups in the feed. Never over
  every item.
- Sentence case for everything else, including buttons and form labels.

## Space and layout

- Spacing uses `--space-1` to `--space-9`, on a 4px base: 4, 8, 12, 16, 24, 32, 48, 64,
  80px.
- One breakpoint: 768px (`48rem`). Below it is the phone layout, above it the desktop
  layout. Media queries cannot read custom properties, so the number is written out in
  each one.
- `--gutter` is 16px on phones and 64px on desktop. Content is at most `--page-max-width`
  (1280px) wide and centred. The header's bottom rule runs the full width.
- Desktop pages with a sidebar use a main column and a 280px aside, 80px apart.
- Every control a finger can hit is at least `--tap-target` (44px) in its smaller
  dimension on phones.

## Components

These are the patterns the mockups set. Each is built as a component when its first
screen ships.

- **Header.** The wordmark "PeerReview" at weight 500 with ".club" at `--text-sm` and
  weight 400. Nav links join as their routes ship. "Log a night" is the one solid button
  in the header.
- **Links.** Ink, underlined, 1px, offset 3px. Hover turns them muted. Night names,
  handles, venues, and DJs are links. Meta text is not.
- **Buttons.** Square corners. Solid ink with page-colored text for the main action on a
  screen, outlined ink for the rest. One solid button per area.
- **Rules.** `--color-rule-strong` under the header and over each section, `--color-rule`
  between rows.
- **Ratings.** Stars followed by the number ("4.5"), with the number in muted text. The
  stars are hidden from screen readers and the number is read instead, as "4.5 out of 5"
  where the context does not say it. The rating picker is a set of radio inputs, half
  steps from 0.5 to 5. Whether Plex Mono has the star glyph is not checked yet; decide
  between the glyph and an SVG star when the rating component is built.
- **Sub-ratings.** A row of small cells (SOUND, VENUE, SETS), label over value, with a
  `--color-rule` line between cells. Only the ratings the log has are shown.
- **Form fields.** `--color-field` background, `--color-control-border` border, 46px tall.
  The label sits above the field, help text below it in muted `--text-sm`.
- **Toggle buttons** (sets in the log form). Outlined when off, solid ink when on, with
  `aria-pressed`.
- **Loading fallbacks.** Rows the size of the real content, drawn with
  `--color-placeholder-block`, so the page does not move when data arrives (ADR 0019).
- **Empty states.** One sentence saying what is missing, one sentence saying what to do,
  and the action as a button.
- **Focus.** Every focusable element shows `--focus-ring` (2px ink, 2px offset) on
  `:focus-visible`, set once in `src/styles/reset.css`.
