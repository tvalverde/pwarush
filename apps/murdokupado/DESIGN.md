---
name: SUDOKUPADO Design System
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

## Brand & Style

The design system is rooted in the philosophy of "Zen Focus." It aims to eliminate cognitive load, allowing the user to immerse themselves entirely in the logic of the puzzle. The aesthetic is **Minimalist and High-Contrast**, blending the clarity of Swiss design with the functional elegance of modern mobile interfaces.

The target audience is intellectually curious users who value a premium, ad-free aesthetic. The UI should evoke a sense of calm, precision, and sophistication. Every element is intentional, utilizing generous whitespace and a restricted palette to direct attention toward the game grid.

## Colors

The palette is strictly monochromatic and utilitarian, relying on values of Slate to create depth without distraction.

- **Background (#FFFFFF):** The primary canvas, ensuring maximum legibility and a clean, "paper-like" feel.
- **Primary Text & Dark Accents (#0F172A):** Used for headlines, active game numbers, and high-impact UI elements. It provides the "ink" that anchors the experience.
- **Borders & Subtle Accents (#E2E8F0):** Defines the grid and secondary containers. This color provides structure without visual noise.
- **Subtle Backgrounds (#F1F5F9):** Used for non-interactive areas or background fills for the game board to distinguish regions.

## Typography

This design system uses a dual-sans-serif pairing to distinguish between branding and utility.

- **Headlines:** Use **Hanken Grotesk**. For major titles, apply "tracking-widest" (0.15em) to create an editorial, premium feel.
- **Body & Interface:** Use **Inter** for its exceptional legibility at small sizes, particularly for system messages and settings.
- **Game Numbers:** Use **Hanken Grotesk** at a medium weight for the Sudoku grid to ensure numbers are distinct and modern, avoiding the "math textbook" look of traditional fonts.

## Layout & Spacing

This design system follows a **Mobile-First Fixed Grid** philosophy. As a PWA game, the interface is optimized for handheld portrait use.

- **Constraints:** The main content container is capped at `448px` (max-w-md) and centered on larger screens to maintain a compact, "app-like" experience.
- **Rhythm:** An 8px base unit governs all padding and margins. 
- **The Grid:** The Sudoku board uses a `2px` gap for the internal 9x9 cells and a `4px` gap to distinguish the 3x3 sub-grids.
- **Safe Zones:** Use 20px horizontal margins on mobile to ensure interactive elements don't hit the screen edge.

## Elevation & Depth

This design system avoids shadows to maintain a minimalist, high-contrast aesthetic. Depth is achieved through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Base):** White (#FFFFFF) background.
- **Level 1 (Grid/Containers):** Light Gray (#F1F5F9) fills with 1px Light Slate (#E2E8F0) borders.
- **Overlays/Modals:** White background with a heavy 2px Dark Slate (#0F172A) border to create a "pop" effect without using blurs or shadows.
- **Interaction:** Depth is communicated through color inversion rather than physical height (e.g., an active button turns from White/Slate to solid Slate 900).

## Shapes

The shape language is defined by **Pill-Shaped (Roundedness 3)** geometry for interactive elements. This softens the high-contrast color palette and makes the UI feel approachable and tactile.

- **Buttons & Toggles:** Always fully rounded (pill-shaped).
- **Game Grid Cells:** Maintain a slight rounding (4px) to avoid a harsh technical look, though they remain primarily square to preserve grid integrity.
- **Cards/Modals:** Use `rounded-xl` (1.5rem) to differentiate them from the sharp lines of the game board.

## Components

### Buttons
- **Primary:** Solid Dark Slate (#0F172A) background with White (#FFFFFF) text. Pill-shaped.
- **Secondary/Ghost:** White background with 1px Light Slate (#E2E8F0) border and Dark Slate text. Pill-shaped.
- **Active State:** On press, primary buttons shift to a slightly lighter slate; ghost buttons fill with Light Gray (#F1F5F9).

### Toggle Switches
- **Track:** Pill-shaped. Light Gray (#F1F5F9) when off, Dark Slate (#0F172A) when on.
- **Thumb:** Pure White circle. High-contrast movement. No shadows.

### Input Fields (Numbers)
- **Cell Style:** White background. Active cell has a 2px Dark Slate border. "Note" mode uses Inter at 10px size in the corners of the cell.
- **Keypad:** Pill-shaped buttons at the bottom of the screen. Selected number is inverted (Dark Slate background).

### Cards & Dialogs
- Use a White background with a 1px Light Slate border. Ensure headlines within cards use the "wide tracking" rule defined in the typography section.

### Progress Indicators
- Linear bars with a Light Gray (#F1F5F9) track and a Dark Slate (#0F172A) fill. No rounded corners on the fill itself for a precise, "loading" aesthetic.