---
name: Cyber-Noir Mystery
colors:
  surface: '#0d1516'
  surface-dim: '#0d1516'
  surface-bright: '#333a3c'
  surface-container-lowest: '#080f11'
  surface-container-low: '#151d1e'
  surface-container: '#192122'
  surface-container-high: '#242b2d'
  surface-container-highest: '#2e3638'
  on-surface: '#dce4e5'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#dce4e5'
  inverse-on-surface: '#2a3233'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#c7c5d1'
  on-secondary: '#302f39'
  secondary-container: '#494852'
  on-secondary-container: '#b9b7c3'
  tertiary: '#ffeac0'
  on-tertiary: '#3e2e00'
  tertiary-container: '#fec931'
  on-tertiary-container: '#6f5500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e4e1ee'
  secondary-fixed-dim: '#c7c5d1'
  on-secondary-fixed: '#1b1b24'
  on-secondary-fixed-variant: '#464650'
  tertiary-fixed: '#ffdf96'
  tertiary-fixed-dim: '#f3bf26'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#0d1516'
  on-background: '#dce4e5'
  surface-variant: '#2e3638'
  success: '#00ff88'
  on-success: '#00391d'
  success-container: '#00522c'
  on-success-container: '#a8ffd2'
  warning: '#ffdf96'
  on-warning: '#3e2e00'
  warning-container: '#594400'
  on-warning-container: '#ffefcd'
  info: '#00e5ff'
  on-info: '#00363d'
  info-container: '#004f58'
  on-info-container: '#9cf0ff'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-pill:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  element-gap: 16px
  section-margin: 40px
---

## Brand & Style

The brand personality of this design system is built on tension, anonymity, and the high-stakes atmosphere of digital deception. It targets an audience that enjoys social deduction, psychological gaming, and sleek, tech-forward interfaces. The emotional response is one of "focused mystery"—the UI should feel like a secure, underground terminal where players uncover secrets.

The visual style is a hybrid of **Minimalism** and **High-Contrast Bold**. It relies on a "void" philosophy, using the deep background (#0d1516) to create an infinite canvas where only critical information and interactable elements "glow" into existence. This creates a focused user experience where the UI recedes and the game's social dynamics take center stage.

## Colors

The palette is strictly designed for pure dark mode performance. The background (#0d1516) provides the ultimate foundation for contrast, ensuring that the **Electric Cyan** (#00E5FF) accents appear to emit light.

Container surfaces use the dark teal (#192122) to provide subtle separation from the background without breaking the dark aesthetic. Semantic colors for success and error also follow the "Neon" logic, using high-saturation hues that pierce through the darkness to provide immediate feedback during gameplay.

## Typography

This design system utilizes two distinct typefaces to balance character with utility. **Space Grotesk** is used for headlines and technical labels; its geometric, futuristic skeletal structure reinforces the "tech-mystery" aesthetic. All major headers should be set in bold weights with tight letter spacing to command attention.

For readability—essential for reading role cards and game rules—**Plus Jakarta Sans** is employed for body text. Its modern, open counters ensure that even at smaller sizes in dark mode, the text remains legible and does not suffer from "halation" or glow-bleed against the black background.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with a strong emphasis on "The Void"—using generous negative space to heighten the sense of mystery. A strict 8px rhythm governs all spatial relationships.

Content should be centered or grouped in clear vertical stacks to maintain a "terminal" feel. Margins are intentionally wide (minimum 24px) to ensure that the Electric Cyan interactables never feel cluttered, allowing the vibrant accents to act as clear beacons for the user's eye.

## Elevation & Depth

In a pure dark mode environment, traditional drop shadows are ineffective. Instead, this design system uses **Tonal Layers** and **Outer Glows**.

Hierarchy is established by lightening the surface color slightly as it "lifts" toward the user. Primary interactable elements (like active buttons) utilize a subtle 0 0 15px Cyan outer glow to simulate a light-emitting neon source. For container separation, use 1px solid borders in the dark teal palette rather than shadows to maintain a crisp, digital-first appearance.

## Shapes

The shape language is a mix of geometric precision and organic softness. While containers use a **Rounded** (0.5rem) corner radius to feel modern and accessible, specialized interactive elements like chips and action buttons utilize a **Pill-shaped** (full radius) approach. This distinction helps users instantly differentiate between "content containers" and "actionable items."

## Components

### Primary Button

The primary action button is the high-contrast centerpiece. It features a solid Electric Cyan background with dark text. On hover or active states, it should trigger a subtle outer glow.

### Pill-Shaped Chips

Used for roles or categories.

- **Active State:** Cyan border (1px) with a faint cyan tint fill and white text.
- **Inactive State:** Dark grey border with muted grey text.

### Stylized Input Fields

Inputs are defined by a bottom-only or thin-outline border in dark grey. They must include a fixed-width icon slot on the left. Upon focus, the border and icon transition to Electric Cyan, signaling an active data-entry state.

### Role Cards

Cards use the dark teal surface (#192122). They should be minimally decorated, relying on a bold Space Grotesk header and a single Electric Cyan icon to denote the role's alignment.

### Status Indicators

Small, circular dots or thin lines that pulse slightly when a player is "Thinking" or "Acting," reinforcing the live, high-stakes nature of the game.

## Relation to the Shared System

This app adheres ONLY to the color contract (the semantic `--color-*` role names) defined in `packages/core/DESIGN.md`. Typography (Space Grotesk + Plus Jakarta Sans), radii, and spacing are app-specific and differ from the shared system used by Sudokupado and Murdokupado. The app deliberately does NOT import `@pwarush/core/theme.css` to preserve its cyberpunk-neon identity.
