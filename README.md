# PWARUSH

PWARUSH is a monorepo of offline-first Progressive Web Apps (PWAs) built on a
shared, incrementally extracted shell. It hosts two puzzle games and the
`@pwarush/core` package that powers both.

- **Sudokupado** — a premium, minimalist, "Zen Focus" Sudoku PWA. High-contrast,
  distraction-free, fully playable offline and installable on Android/iOS.
- **Murdokupado** — a Latin-square detective puzzle (Cluedo-style). Navigable
  stub today; the game engine and branding land in a later milestone.

Both apps share the PWA shell, persistence, store patterns, UI primitives and
the color-free design system, but keep their own game logic and palette.

## Layout

```
pwarush/
├── apps/
│   ├── sudokupado/        # @pwarush/sudokupado — the mature Sudoku PWA
│   └── murdokupado/       # @pwarush/murdokupado — Latin-square stub
├── packages/
│   └── core/              # @pwarush/core — shared shell (see packages/core/README.md)
├── landing/               # static landing listing the games at /pwarush/
├── docs/                  # specs and design references
├── docker/                # Playwright container for reproducible E2E
└── playwright.config.ts   # E2E projects per app
```

`@pwarush/core` is consumed via subpath exports and grows milestone by milestone:
`theme.css` (design tokens), `ui` (Button/Layout/ConfirmDialog), `utils`
(formatters + type-guard factories + SW/device helpers), `persistence` (Dexie
factory + lifecycle autosave), `store` (generic autosave controller), `pwa`
(vite-plugin-pwa factory + shared gesture lockdown CSS). See
[`packages/core/README.md`](./packages/core/README.md) for the module map and
[`packages/core/DESIGN.md`](./packages/core/DESIGN.md) for the color-free design
system; each app maps the semantic tokens to a concrete palette in its own
`DESIGN.md`.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4.
- **State Management:** Zustand with persistence.
- **Database:** Dexie.js (IndexedDB).
- **Animations:** Framer Motion. **Icons:** Lucide React.
- **Tooling:** npm workspaces.
- **Quality Gate:** Biome (lint & format), Vitest (unit & integration),
  Playwright (E2E, see [`apps/sudokupado/e2e/README.md`](./apps/sudokupado/e2e/README.md)).

## Development

The root `Makefile` orchestrates the workspaces:

```bash
make install   # install all workspaces
make dev       # start the Sudokupado dev server
make check     # quality gate: lint + typecheck + test
make build     # build every app for production
make e2e       # end-to-end suite (Playwright, inside the official container)
```

The same targets are available as npm scripts (`npm run check`, `npm test`,
`npm run build`, …), which fan out to the workspaces.

## Deploy

Each app deploys to GitHub Pages under its own subpath, sharing one origin:

- `tvalverde.github.io/pwarush/` — landing
- `tvalverde.github.io/pwarush/sudokupado/` — Sudokupado (own PWA scope)
- `tvalverde.github.io/pwarush/murdokupado/` — Murdokupado (own PWA scope)

## Versioning

SemVer is managed at two independent levels: an annotated monorepo tag
(`vX.Y.Z`, mirrored by the root `package.json`) and a per-workspace version that
tracks each app/package independently. See `CLAUDE.md` for the full policy.

---

Developed with ❤️ by [Toni Valverde](https://github.com/tvalverde).
