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
---

> **Shared foundation:** typography, shapes, spacing, elevation strategy and token scales are defined in [`@pwarush/core/DESIGN.md`](../../packages/core/DESIGN.md). This file specifies **only Sudokupado's brand narrative and concrete color palette**. The palette tokens active in the build live in `apps/sudokupado/src/index.css` (`@theme` `--color-*`).

## Brand & Style

Sudokupado is rooted in the philosophy of **"Zen Focus."** It aims to eliminate cognitive load, allowing the user to immerse themselves entirely in the logic of the puzzle. The aesthetic is **Minimalist and High-Contrast**, blending the clarity of Swiss design with the functional elegance of modern mobile interfaces.

The target audience is intellectually curious users who value a premium, ad-free aesthetic. The UI should evoke calm, precision, and sophistication. Every element is intentional, using generous whitespace and a restricted palette to direct attention toward the game grid.

## Colors

The palette is strictly monochromatic and utilitarian, relying on values of Slate to create depth without distraction. The tokens active in the build (`src/index.css`) are:

- **Background (`--color-background`, #FFFFFF):** The primary canvas — a clean, "paper-like" feel.
- **Primary Text & Dark Accents (`--color-primary-text` / `--color-dark-accent`, #0F172A):** Headlines, active game numbers, high-impact UI. The "ink" that anchors the experience.
- **Borders & Subtle Accents (`--color-border` / `--color-subtle-accent`, #E2E8F0):** Defines the grid and secondary containers — structure without visual noise.
- **Subtle Backgrounds (`--color-subtle-bg`, #F1F5F9):** Non-interactive areas and game-board region fills.
- **Surface / Primary / Secondary / Error (`#f6fafe` / `#000000` / `#595f66` / `#ba1a1a`):** Supporting roles drawn from the extended Material-derived ramp in the frontmatter.

## Components (color application)

- **Buttons — Primary:** Solid Dark Slate (#0F172A) background, White text, pill-shaped.
- **Buttons — Secondary/Ghost:** White background, 1px Light Slate (#E2E8F0) border, Dark Slate text, pill-shaped. Active state fills with Light Gray (#F1F5F9).
- **Toggle Switches:** Pill track — Light Gray (#F1F5F9) off, Dark Slate (#0F172A) on; pure White thumb, no shadows.
- **Input cells (numbers):** White background; active cell has a 2px Dark Slate border; "note" mode uses Inter at 10px in the cell corners.
- **Keypad:** Pill-shaped buttons; selected number inverts to a Dark Slate background.
- **Cards & Dialogs:** White background, 1px Light Slate border; headlines use the wide-tracking rule from the shared system.
- **Progress Indicators:** Light Gray (#F1F5F9) track with a Dark Slate (#0F172A) fill; no rounded corners on the fill for a precise, "loading" aesthetic.
