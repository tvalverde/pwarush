# Neon Quiz — Design

Per-app design identity for `@pwarush/neonquiz`. The shared, color-free foundation
(shapes, typography roles, spacing, the semantic **Color Contract** token names) lives in
[`packages/core/DESIGN.md`](../../packages/core/DESIGN.md). This file documents only what
Neon Quiz does differently.

## Identity

Neon Quiz is a pass-and-play trivia **arena** with a cyberpunk / neon aesthetic: a deep
near-black canvas lit by saturated glows. It deliberately **opts out** of
`@pwarush/core/theme.css` (the light, Material-toned scheme shared by Sudokupado and
Murdokupado) — the same path El Farsante takes — to preserve its dark identity. Because
`theme.css` is not imported, `src/index.css` redeclares the color-free tokens that the
shared core UI components depend on (`--font-sans`, `--font-hanken`, `--tracking-*`,
`--radius-*`, `--container-container`, `--animate-shake`) alongside the full dark palette.

## Color Contract (dark)

Every semantic role from the core contract is provided in `src/index.css` with dark neon
values. Highlights:

- **Background / surface:** `#0a0a0f` base, with tonal `surface-container-*` steps rising
  to `#242435`. No shadows for elevation — separation comes from tonal layers and neon
  outlines.
- **Primary:** cyan neon `#00f0ff` (roll button, focus rings, active tokens).
- **Secondary:** magenta neon `#ff2a8d`.
- **Tertiary:** gold neon `#ffcc00` (Spark highlights).
- **Feedback:** `success #00ff88`, `error #ff5470`.

## Category tints

The six trivia families each own a neon tint, exposed as custom properties and consumed by
the board SVG and the question overlay border via `var(--color-cat-*)`:

| Category        | Token                    | Value     |
| --------------- | ------------------------ | --------- |
| `EMERALD_GEO`   | `--color-cat-emerald`    | `#00FF66` |
| `CRIMSON_HIST`  | `--color-cat-crimson`    | `#FF0055` |
| `VIOLET_ART`    | `--color-cat-violet`     | `#9900FF` |
| `CYAN_SCI`      | `--color-cat-cyan`       | `#00FFFF` |
| `GOLD_ENT`      | `--color-cat-gold`       | `#FFCC00` |
| `ORANGE_SPORT`  | `--color-cat-orange`     | `#FF6600` |

## Typography

Body and UI typography stay on the shared faces (Inter for `--font-sans`, Hanken Grotesk
for `--font-hanken`). The app-local display face is **Orbitron** (`--font-display`), used
for titles, the turn indicator and category labels to carry the arcade/neon tone.

## Player tokens

Players are identified by one of six geometric shapes (`ShapeGlyph`): triangle, square,
pentagon, hexagon, circle, rhombus — rendered as neon-stroked SVG glyphs, one per player,
unique within a match.

## Board

The board is a **flat-top hexagonal honeycomb** of glass tiles floating over a deep-space
backdrop (radial vignette + a faint, slowly twinkling starfield). It is static — the whole
board fits the viewBox, so there is no pan/zoom and a tap on a tile moves there.

- **Tiles** are dark translucent glass (`#nq-glass` radial gradient) with a per-category neon
  rim and a subtle inner tint of the same colour. A single shared glow filter (`#nq-glow`)
  is reserved for emphasised elements (Spark/Nexus/legal moves) to keep mobile performant.
- **Hierarchy by size:** normal tiles are the smallest; **Spark Nodes** are larger, drawn as
  faceted gems with a sparkle; the **Nexus** is the largest — a radiant cyan/white core that
  is dimmed while locked and lights up once the active player holds all six Sparks.
- **Legal-move feedback:** after a roll, valid tiles light from within in their category colour
  (stronger rim + pulse), the connecting path glows and animates a neon trail, and **every other
  tile dims back** so the available moves are unmistakable.
- **Tokens** are haloed glass discs carrying the player's shape glyph, in a per-player accent,
  that glide between tile centres.
- **Motion principle:** lively but tasteful — breathe (Spark/Nexus), pulse (legal tiles), trail
  (path), twinkle (stars), dice pop and victory rings. **All motion is gated by
  `prefers-reduced-motion`**, degrading to static high-contrast highlights.
