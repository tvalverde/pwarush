# @pwarush/core

Shared shell for the pwarush monorepo apps (Sudokupado, Murdokupado).

It grows incrementally as layers are extracted from `apps/sudokupado`:

- ✅ `theme.css` — shared color-free design tokens, Tailwind v4 CSS-first `@theme` (Hito 4)
- ✅ `DESIGN.md` — shared system + semantic color contract; per-app Material palette redesign (Hito 5)
- ✅ `ui/` — generic primitives (`Button`, `Layout`, `ConfirmDialog`), agnostic of store/i18n (text via props) (Hito 6). Consumers must declare `@source` to `core/src/ui` in their CSS (Tailwind v4 does not scan node_modules).
- ✅ `utils/` — formatters, generic type-guard factories, device/SW helpers (Hito 7)
- ✅ `persistence/` — Dexie database factory + lifecycle-aware autosave helper (Hito 8)
- ✅ `store/` — generic autosave controller (snapshot-diff dedup + lifecycle-aware subscription) (Hito 9)
- ✅ `pwa/` — vite-plugin-pwa factory (`createPwaConfig`, `createVersionJsonPlugin`) + shared gesture lockdown CSS (`@pwarush/core/pwa.css`) (Hito 10). Runtime PWA shell primitives (`InstallPrompt`, `IosInstallSteps`, `RotateDeviceOverlay`, `UpdateBanner`) live under the separate `@pwarush/core/pwa/react` subpath — store/i18n-agnostic, driven by props; apps wrap them to inject text and platform logic (Hito 11).

See `plan-monorepo.md` at the repo root for the full roadmap.
