---
name: PWARUSH Shared Design System
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: 0.15em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  number-grid:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container_max_width: 448px
  base_unit: 8px
  gutter: 16px
  margin_mobile: 20px
  grid_gap: 2px
---

## Scope

This document defines the **color-free foundation** shared by every PWARUSH app (Sudokupado, Murdokupado): typography, shape language, spacing rhythm, elevation strategy and the semantic token scales.

- **Per-app color palettes and brand narrative** live in each app's own `apps/<app>/DESIGN.md`.
- **Concrete token values** are materialised in `packages/core/src/theme.css` and consumed by each app via `@import "@pwarush/core/theme.css"`.

## Typography

PWARUSH uses a dual-sans-serif pairing to distinguish between branding and utility.

- **Headlines:** Use **Hanken Grotesk**. For major titles, apply wide tracking (`tracking-widest-premium`, 0.15em) to create an editorial, premium feel.
- **Body & Interface:** Use **Inter** for its exceptional legibility at small sizes, particularly for system messages and settings.
- **Numeric / grid figures:** Use **Hanken Grotesk** at a medium weight so numbers read as distinct and modern, avoiding the "math textbook" look of traditional fonts.

The named type ramp (`headline-lg`, `headline-md`, `body-lg`, `body-md`, `label-caps`, `number-grid`) is defined in the frontmatter above and is the canonical scale for all apps.

## Layout & Spacing

A **Mobile-First Fixed Grid** philosophy. As PWAs, the interfaces are optimized for handheld portrait use.

- **Constraints:** The main content container is capped at `448px` (`max-w-container`) and centered on larger screens to maintain a compact, "app-like" experience.
- **Rhythm:** An `8px` base unit governs all padding and margins.
- **Safe Zones:** Use `20px` horizontal margins on mobile so interactive elements don't hit the screen edge; honour the device safe-area insets (`pb-safe`).

## Elevation & Depth

PWARUSH avoids shadows as a structural tool to keep a minimalist, high-contrast aesthetic. Depth is achieved through **tonal layers** and **low-contrast outlines** rather than physical height.

- **Base:** the app surface.
- **Containers:** a subtle tonal fill with a 1px low-contrast border.
- **Overlays / Modals:** the surface with a heavier, high-contrast border to "pop" without blurs or drop shadows.
- **Interaction:** communicated through color inversion (an active control swaps surface and ink colors) rather than elevation.

The concrete colors that fill these roles are defined per app.

## Shapes

The shape language is defined by **pill-shaped geometry** for interactive elements. This softens high-contrast palettes and makes the UI feel approachable and tactile.

- **Buttons & Toggles:** Always fully rounded (`rounded-full`, pill-shaped).
- **Cards / Dialogs:** Use the larger radii (`rounded-md` / `rounded-xl`) to differentiate them from sharper, grid-like surfaces.
- **Grid / data cells:** Maintain only a slight rounding so they read as precise and technical.

## Semantic tokens

| Concern | Scale | Source |
| --- | --- | --- |
| Radius | `rounded-sm` (0.5rem) · `rounded` (1rem) · `rounded-md` (1.5rem) · `rounded-lg` (2rem) · `rounded-xl` (3rem) · `rounded-full` | `theme.css` `--radius-*` |
| Spacing (custom) | `8px` · `16px` · `20px` (atop the default Tailwind scale) | `theme.css` `--spacing-*` |
| Container | `max-w-container` (448px) | `theme.css` `--container-container` |
| Fonts | `font-sans` (Inter) · `font-hanken` (Hanken Grotesk) | `theme.css` `--font-*` |
| Tracking | `tracking-widest-premium` (0.15em) · `tracking-wide-premium` (0.1em) | `theme.css` `--tracking-*` |
| Animation | `animate-shake` | `theme.css` `--animate-shake` |

**Color is intentionally absent here.** Each app declares its palette as `--color-*` tokens in its own `@theme` block; Tailwind v4 merges those with the shared tokens above.
