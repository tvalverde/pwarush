# @pwarush/core

Shared shell for the pwarush monorepo apps (Sudokupado, Murdokupado).

It grows incrementally as layers are extracted from `apps/sudokupado`:

- ✅ `theme.css` — shared color-free design tokens, Tailwind v4 CSS-first `@theme` (Hito 4)
- ✅ `DESIGN.md` — shared system + semantic color contract; per-app Material palette redesign (Hito 5)
- ✅ `ui/` — generic primitives (`Button`, `Layout`, `ConfirmDialog`), agnostic of store/i18n (text via props) (Hito 6). Consumers must declare `@source` to `core/src/ui` in their CSS (Tailwind v4 does not scan node_modules).
- ✅ `utils/` — formatters, generic type-guard factories, device/SW helpers (Hito 7)
- ✅ `persistence/` — Dexie database factory + lifecycle-aware autosave helper (Hito 8)
- `store/` — Zustand patterns with throttled persist (Hito 9)
- `pwa/` — vite-plugin-pwa factory + gesture lockdown helpers (Hito 10)

See `plan-monorepo.md` at the repo root for the full roadmap.
