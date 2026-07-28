# ROKO explorer style system

The visual ground truth for this explorer is [roko.network](https://roko.network/).
The explorer adapts that system to dense blockchain data while preserving the
marketing site's monochrome, technical character.

## Typography

- Display and section headings use locally hosted Rajdhani at weights 300–700.
- Interface and long-form copy use the operating system UI stack. This matches
  the visible fallback used for body copy on the reference site.
- Hashes, addresses, timestamps, and numeric data use locally hosted JetBrains
  Mono.
- Heading hierarchy is 32/36, 24/30, 18/24, 16/22, and 14/20 pixels.

Font files live in `public/static/fonts/roko` and are loaded from
`nextjs/global.css`; no third-party font request is needed at runtime.

## Colour

Light mode uses white surfaces, graphite text, and low-alpha graphite borders.
Dark mode inverts those relationships: near-black surfaces, silver text, and
low-alpha white borders.

ROKO teal (`#00D4AA`) is a sparse graphic accent for charts, markers, and focus
states. Teal used as text must use the contrast-safe `brand.accentText` token:
`#00836A` in light mode and `#52E9CB` in dark mode.

Use semantic tokens rather than mode-specific literals:

- `bg.primary`, `bg.muted`, `bg.elevated`, `bg.hero`
- `heading`, `text.primary`, `text.secondary`
- `border`, `border.divider`, `border.strong`
- `brand.accent`, `brand.accentText`
- `button.solid.*`, `button.outline.*`
- `input.*`, `selected.*`, `focus.ring`

## Shape and spacing

- Standard surface and control radius: 8px.
- Small technical marks and badges: 2px.
- Large dialogs only: 12px.
- Cards and prominent controls use 2px borders.
- Dividers and internal table rows use 1px borders.
- The system uses borders and tonal shifts instead of drop shadows.
- Default card padding is 24px; prominent/desktop panels may use 32px.
- Standard gaps are 8px, 16px, 24px, and 32px.

## Controls

- Small controls: 40px high.
- Default controls: 48px high.
- Large/hero controls: 60px high.
- Buttons use a 2px border, 8px radius, semibold system UI text, and no shadow.
- Primary buttons invert with the colour mode: black/white in light mode and
  white/black in dark mode.
- Focus is always a visible 2px black/white outline with a 2px offset.

## Component rules

- Cards are elevated semantic surfaces with a 2px divider border and 8px
  radius.
- Tables use uppercase Rajdhani column labels, tabular numbers, neutral header
  fills, and line-separated rows.
- Popovers, menus, selects, dialogs, drawers, alerts, and toasts use semantic
  surfaces and borders with no elevation shadow.
- Charts inherit text and grid-line colours from semantic tokens. Status
  colours remain reserved for success, warning, and error meaning.
- The ROKO mark is served from `/roko-logo.png`; network presets must not replace
  it in explorer navigation.

Do not style generated Emotion classes such as `.css-*`. Change the
component source or a shared recipe/token so server-rendered, client-rendered,
light, and dark states remain aligned.
