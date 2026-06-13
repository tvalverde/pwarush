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

This document defines the **color-free foundation** shared by the apps that import `@pwarush/core/theme.css` (Sudokupado, Murdokupado): typography, shape language, spacing rhythm, elevation strategy and the semantic token scales.

El Farsante keeps its own visual identity — its own typography (Space Grotesk + Plus Jakarta Sans) and radii, and it does NOT import `@pwarush/core/theme.css`. It adheres ONLY to the "Color contract" role names defined at the bottom of this document.

- **Per-app color palettes and brand narrative** live in each app's own `apps/<app>/DESIGN.md`.
- **Concrete token values** are materialised in `packages/core/src/theme.css` and consumed by Sudokupado and Murdokupado via `@import "@pwarush/core/theme.css"`.

## Typography

PWARUSH uses a dual-sans-serif pairing to distinguish between branding and utility.

- **Headlines:** Use **Hanken Grotesk**. For major titles, apply wide tracking (`tracking-widest-premium`, 0.15em) to create an editorial, premium feel.
- **Body & Interface:** Use **Inter** for its exceptional legibility at small sizes, particularly for system messages and settings.
- **Numeric / grid figures:** Use **Hanken Grotesk** at a medium weight so numbers read as distinct and modern, avoiding the "math textbook" look of traditional fonts.

The named type ramp (`headline-lg`, `headline-md`, `body-lg`, `body-md`, `label-caps`, `number-grid`) is defined in the frontmatter above and is the canonical scale for all apps.

### Optional per-app display face

Body and interface typography (`--font-sans` / `--font-hanken`) are **shared** and must not be overridden per app. An app MAY, however, add a single **app-local display face** — `--font-display` in its own `@theme` — for brand surfaces only (wordmark, screen titles, and themed evidence such as a clue list). This is the one sanctioned typographic divergence: it carries brand identity without forking the shared reading typography. Apps that do this document the face and where it is applied in their own `apps/<app>/DESIGN.md`. (Murdokupado uses a typewriter face for its case-file identity; Sudokupado defines none.)

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

## Color contract

Color values live **per app** (each app declares `--color-*` in its own `@theme`; Tailwind v4 merges them with the shared tokens above). But the **role names are a shared contract**: every app MUST provide this Material-based semantic set so that components extracted to `@pwarush/core/ui` can rely on it without knowing any concrete palette.

| Group | Roles (`--color-*`) |
| --- | --- |
| Surfaces | `surface`, `surface-dim`, `surface-bright`, `surface-container-lowest`, `surface-container-low`, `surface-container`, `surface-container-high`, `surface-container-highest`, `surface-variant`, `on-surface`, `on-surface-variant`, `inverse-surface`, `inverse-on-surface`, `surface-tint` |
| Background | `background`, `on-background` |
| Outline | `outline`, `outline-variant` |
| Primary | `primary`, `on-primary`, `primary-container`, `on-primary-container`, `inverse-primary`, `primary-fixed`, `primary-fixed-dim`, `on-primary-fixed`, `on-primary-fixed-variant` |
| Secondary | `secondary`, `on-secondary`, `secondary-container`, `on-secondary-container`, `secondary-fixed`, `secondary-fixed-dim`, `on-secondary-fixed`, `on-secondary-fixed-variant` |
| Tertiary | `tertiary`, `on-tertiary`, `tertiary-container`, `on-tertiary-container`, `tertiary-fixed`, `tertiary-fixed-dim`, `on-tertiary-fixed`, `on-tertiary-fixed-variant` |
| Error | `error`, `on-error`, `error-container`, `on-error-container` |
| Feedback (extended) | `success`, `on-success`, `success-container`, `on-success-container`, `warning`, `on-warning`, `warning-container`, `on-warning-container`, `info`, `on-info`, `info-container`, `on-info-container` |

Each role follows the Material convention: a base color and its readable `on-*` counterpart. The concrete palette for each app lives in `apps/<app>/DESIGN.md` and is materialised in `apps/<app>/src/index.css`.
