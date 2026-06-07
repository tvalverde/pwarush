---
name: SUDOKUPADO Design System
extends: '@pwarush/core/DESIGN.md'
colors:
  surface: '#f6fafe'
  surface-dim: '#d6dade'
  surface-bright: '#f6fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4f8'
  surface-container: '#eaeef2'
  surface-container-high: '#e4e9ed'
  surface-container-highest: '#dfe3e7'
  on-surface: '#171c1f'
  on-surface-variant: '#45464d'
  inverse-surface: '#2c3134'
  inverse-on-surface: '#edf1f5'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#595f66'
  on-secondary: '#ffffff'
  secondary-container: '#dde3eb'
  on-secondary-container: '#5f656c'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dde3eb'
  secondary-fixed-dim: '#c1c7cf'
  on-secondary-fixed: '#161c22'
  on-secondary-fixed-variant: '#41474e'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f6fafe'
  on-background: '#171c1f'
  surface-variant: '#dfe3e7'
  success: '#22c55e'
  on-success: '#ffffff'
  success-container: '#f0fdf4'
  on-success-container: '#15803d'
  warning: '#eab308'
  on-warning: '#ffffff'
  warning-container: '#fef9c3'
  on-warning-container: '#713f12'
  info: '#3b82f6'
  on-info: '#ffffff'
  info-container: '#dbeafe'
  on-info-container: '#1e3a8a'
---

> **Shared foundation:** typography, shapes, spacing, elevation strategy and token scales are defined in [`@pwarush/core/DESIGN.md`](../../packages/core/DESIGN.md). This file specifies **only Sudokupado's brand narrative and concrete color palette**. The palette tokens active in the build live in `apps/sudokupado/src/index.css` (`@theme` `--color-*`).

## Brand & Style

Sudokupado is rooted in the philosophy of **"Zen Focus."** It aims to eliminate cognitive load, allowing the user to immerse themselves entirely in the logic of the puzzle. The aesthetic is **Minimalist and High-Contrast**, blending the clarity of Swiss design with the functional elegance of modern mobile interfaces.

The target audience is intellectually curious users who value a premium, ad-free aesthetic. The UI should evoke calm, precision, and sophistication. Every element is intentional, using generous whitespace and a restricted palette to direct attention toward the game grid.

## Colors

The palette follows a **Material scheme** (surfaces, on-* pairs, primary/secondary/tertiary, error and extended feedback). It stays minimalist and high-contrast, but every color is a semantic role from the shared [color contract](../../packages/core/DESIGN.md). The roles materialised in the build (`src/index.css`) are the full set listed in the frontmatter above. Key roles:

- **Background (`background`, #f6fafe) / `on-background` (#171c1f):** the app canvas behind the content card.
- **Surfaces (`surface-container-lowest` #ffffff … `surface-container-highest` #dfe3e7):** tonal layers for cards, fills and elevated regions; text over them uses `on-surface` (#171c1f) / `on-surface-variant` (#45464d).
- **Outlines (`outline` #76777d / `outline-variant` #c6c6cd):** the default border color and grid/structure lines.
- **Primary (`primary` #000000 / `on-primary` #ffffff):** high-impact actions (PLAY, active difficulty, keypad selection).
- **Secondary (`secondary` #595f66):** muted labels and secondary text.
- **Tertiary fixed (`tertiary-fixed` #fcdeb5 / `tertiary-fixed-dim` #dec29a):** the amber highlight on the game board.
- **Error (`error` #ba1a1a + container/on-*):** danger zones and destructive actions.
- **Feedback — `success` (correct cells), `warning` (achievement star / cell hint), `info` (cell highlights):** each with its `container`/`on-*` pair.

## Components (color application)

- **Buttons — Primary:** `bg-primary` (#000) with `on-primary` text, pill-shaped.
- **Buttons — Secondary/Ghost:** `surface-container-lowest` background, 1px `outline-variant` border, `on-surface` text, pill-shaped.
- **Toggle Switches:** pill track — `surface-container` off, `primary` on; `surface-container-lowest` thumb.
- **Input cells (numbers):** `surface-container-lowest` background; active cell uses a `primary` border; correct cells use `success`; the board highlight uses `tertiary-fixed`.
- **Keypad:** pill-shaped buttons; selected number inverts to `bg-primary`.
- **Cards & Dialogs:** `surface-container-lowest` background, 1px `outline-variant` border; headlines use the wide-tracking rule from the shared system.
- **Progress Indicators:** `surface-container` track with a `primary` fill.
