---
name: MURDOKUPADO Design System
extends: '@pwarush/core/DESIGN.md'
status: provisional
colors:
  background: '#ffffff'
  primary-text: '#0f172a'
  dark-accent: '#0f172a'
  border: '#e2e8f0'
  subtle-accent: '#e2e8f0'
  subtle-bg: '#f1f5f9'
  surface: '#f6fafe'
  primary: '#000000'
  secondary: '#595f66'
  error: '#ba1a1a'
---

> **Shared foundation:** typography, shapes, spacing, elevation strategy and token scales are defined in [`@pwarush/core/DESIGN.md`](../../packages/core/DESIGN.md). This file specifies **only Murdokupado's brand narrative and concrete color palette**. The palette tokens active in the build live in `apps/murdokupado/src/index.css` (`@theme` `--color-*`).

## Status: provisional identity

Murdokupado is a **Latin-square detective puzzle — coming soon**. It does not yet have its own visual identity: the palette below is a **provisional clone of Sudokupado's** so the app can share the core foundation while it is built out. Defining a distinct Murdokupado palette (themed around its detective/mystery concept) is deferred to a future milestone — and, by design, it can diverge here without touching `@pwarush/core`.

## Brand & Style (placeholder)

Until the dedicated identity is designed, Murdokupado inherits the **Minimalist, High-Contrast** aesthetic of the shared system. This section is expected to change once the app becomes functional.

## Colors (provisional)

The tokens active in the build (`src/index.css`) — currently identical to Sudokupado's core slate palette:

- **Background (`--color-background`, #FFFFFF)**
- **Primary Text / Dark Accents (`--color-primary-text` / `--color-dark-accent`, #0F172A)**
- **Borders / Subtle Accents (`--color-border` / `--color-subtle-accent`, #E2E8F0)**
- **Subtle Backgrounds (`--color-subtle-bg`, #F1F5F9)**
- **Surface / Primary / Secondary / Error (`#f6fafe` / `#000000` / `#595f66` / `#ba1a1a`)**
