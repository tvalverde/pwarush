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

The case board paints each room's floor with a distinct tint so adjacent rooms read as separate map regions. These are Murdokupado-specific tokens (`--color-room-1..4` in `src/index.css`), assigned by room order. The `FloorPlan` SVG consumes them directly as floor fills via `var(--color-room-*)` — the values live in the token layer, the component references the tokens, never raw hex (rule 4). The tints are warm file-folder tones with one cool "blueprint" among them for separation: manila, blueprint blue-grey, tan/ochre and sage ledger — distinguishable without competing with the ink wall lines or person tokens.

### Illustrated board (crime-scene floor plan)

The board is rendered as a **top-down ink floor plan**, derived procedurally from the scene geometry — no per-scene art, so it scales to any new scene for free. The render is split into two superimposed layers:

- **`FloorPlan` (SVG, background, non-interactive):** room floors tinted by `--color-room-*`, **ink walls** (`var(--color-primary)`) traced along every edge between distinct regions (room borders, blocked-cell outlines and the outer perimeter), object glyphs, and a 45° ink hatch over blocked cells (rubble). Geometry comes from the pure `computeFloorPlan(scene)` (`src/engine/floorplan.ts`); the wall-tracing rule covers L-shaped and column-shaped rooms.
- **Interaction layer (transparent button grid):** preserves hit-areas, keyboard focus and test hooks; renders the person tokens on top.

**Top-down is a puzzle constraint, not a style choice:** clues read "in row 2 / column 3", so the row/column legibility of a Latin square must survive — an isometric view would destroy it.

**Object glyphs** (`board/ObjectGlyph.tsx`): a Murdokupado-specific set of monochrome ink glyphs (one per `ObjectKind`), drawn in a 24×24 local viewBox in the sepia stroke (`var(--color-secondary)`), replacing the generic `lucide` icons on the board (lucide stays for app chrome). 

**Person tokens** (`board/PersonToken.tsx`): a **case-file dossier card** — an ink-dark body (`--color-primary`) with a generic portrait silhouette and the initial set in the display face (Courier Prime), plus a deterministic per-person accent band (stable hash of the id over a few subdued paper-harmonised tones). The **victim** is drawn differently: a chalk-outline silhouette (`--color-error`, dashed) over paper, reading as "the body" — it is known case data, so distinguishing it is correct. Selection and the murderer reveal use a crimson (`--color-tertiary`) ring.

### Display face (typewriter)

Per the shared contract's *optional per-app display face*, Murdokupado adds `--font-display` — **Courier Prime**, a clean typewriter — for brand surfaces only: the wordmark, screen titles, section labels, the clue list (typed case notes) and the result reveal. Body and interface text stay on the shared **Inter** (`font-sans`) / **Hanken Grotesk** (`font-hanken`). The fonts are bundled offline via `@fontsource`.

## Brand & Style

Murdokupado keeps the shared **minimalist, high-contrast** structure (pill controls, tonal layers, low-contrast outlines, no drop shadows) but recasts it in paper-and-ink. The result should feel less like an app chrome and more like a physical dossier the player annotates.
