---
name: MURDOKUPADO Design System
extends: '@pwarush/core/DESIGN.md'
status: active
palette: case-file-pulp
---

> **Shared foundation:** typography (body/UI), shapes, spacing, elevation strategy and token scales are defined in [`@pwarush/core/DESIGN.md`](../../packages/core/DESIGN.md), including the **semantic color contract** (role names every app must provide). This file specifies Murdokupado's brand narrative, palette and display face. The tokens active in the build live in `apps/murdokupado/src/index.css` (`@theme`).

## Identity: the case file (pulp)

Murdokupado is a **Latin-square detective puzzle**. Its identity is a **vintage case file / pulp** aesthetic: aged paper, ink, a crimson stamp and sepia annotations — as if the player were leafing through a detective's dossier. It diverges from Sudokupado entirely in value while honouring the shared semantic role names (so `@pwarush/core` is never touched for colour).

### Palette (light)

A warm, low-saturation paper scheme. Concrete `--color-*` values live in `src/index.css`; the roles map as:

- **Surfaces:** aged paper (`#f4efe4` background, `#fffdf7` cards), with a warm container scale for tonal layering.
- **Ink:** `on-surface` `#1a1714` for text; faded sepia (`#5a4f43`) for secondary text.
- **Primary — ink:** near-black ink (`#241c15`) drives the high-contrast actors: primary buttons, person tokens and the board grid lines (drawn-on-paper feel).
- **Secondary — sepia:** `#6b5d4f` for muted annotations and chips.
- **Tertiary / accent — crimson stamp:** `#8c1c13`, the dossier's red rubber-stamp accent.
- **Error / danger:** deep red ink (`#a3170c`); the murderer reveal is rendered in this red.
- **Feedback (success/warning/info):** harmonised muted olive / ochre / faded-blue inks so notifications sit inside the paper world.

### Room-region tints

The case board paints each room with a distinct background so adjacent rooms read as separate map regions. These are Murdokupado-specific tokens (`--color-room-1..4` in `src/index.css`), assigned by room order; components reference only the generated `bg-room-*` utilities, never raw values (rule 4). The tints are warm file-folder tones with one cool "blueprint" among them for separation: manila, blueprint blue-grey, tan/ochre and sage ledger — distinguishable without competing with the ink grid lines or person tokens.

### Display face (typewriter)

Per the shared contract's *optional per-app display face*, Murdokupado adds `--font-display` — **Courier Prime**, a clean typewriter — for brand surfaces only: the wordmark, screen titles, section labels, the clue list (typed case notes) and the result reveal. Body and interface text stay on the shared **Inter** (`font-sans`) / **Hanken Grotesk** (`font-hanken`). The fonts are bundled offline via `@fontsource`.

## Brand & Style

Murdokupado keeps the shared **minimalist, high-contrast** structure (pill controls, tonal layers, low-contrast outlines, no drop shadows) but recasts it in paper-and-ink. The result should feel less like an app chrome and more like a physical dossier the player annotates.
