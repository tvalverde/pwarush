---
name: MURDOKUPADO Design System
extends: '@pwarush/core/DESIGN.md'
status: provisional
palette: clone-of-sudokupado-material
---

> **Shared foundation:** typography, shapes, spacing, elevation strategy and token scales are defined in [`@pwarush/core/DESIGN.md`](../../packages/core/DESIGN.md), including the **semantic color contract** (role names every app must provide). This file specifies only Murdokupado's brand narrative and palette status. The palette tokens active in the build live in `apps/murdokupado/src/index.css` (`@theme` `--color-*`).

## Status: provisional identity

Murdokupado is a **Latin-square detective puzzle — coming soon**. It does not yet have its own visual identity: its palette is a **provisional clone of Sudokupado's Material scheme** (same `--color-*` values, see [`apps/sudokupado/DESIGN.md`](../sudokupado/DESIGN.md)). Defining a distinct Murdokupado palette (themed around its detective/mystery concept) is deferred to a future milestone — and, by design, it can diverge here without touching `@pwarush/core`, since only the role names are shared, not the values.

## Brand & Style (placeholder)

Until the dedicated identity is designed, Murdokupado inherits the **Minimalist, High-Contrast** Material aesthetic of Sudokupado. This section is expected to change once the app becomes functional.
