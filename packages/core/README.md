# @pwarush/core

Shared shell for the pwarush monorepo apps (Sudokupado, Murdokusado).

Currently a stub. It grows incrementally from Hito 4 onwards as the
following layers are extracted from `apps/sudokupado`:

- `design/` — tokens, Tailwind preset, semantic naming (Hito 4)
- `ui/` — generic primitives (`Button`, `ConfirmDialog`, `Layout`, …) (Hito 5)
- `utils/` — formatters, schemas guards factories (Hito 6)
- `persistence/` — Dexie wrapper + lifecycle hooks (Hito 7)
- `store/` — Zustand patterns with throttled persist (Hito 8)
- `pwa/` — vite-plugin-pwa factory + gesture lockdown helpers (Hito 9)

See `plan-monorepo.md` at the repo root for the full roadmap.
