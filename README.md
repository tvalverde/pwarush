# PWARUSH

PWARUSH is a monorepo of offline-first Progressive Web Apps (PWAs) built on a
shared, incrementally extracted shell. It hosts three games and the
`@pwarush/core` package that powers them.

- **Sudokupado** — a premium, minimalist, "Zen Focus" Sudoku PWA. High-contrast,
  distraction-free, fully playable offline and installable on Android/iOS.
- **Murdokupado** — a Latin-square detective puzzle (Cluedo-style). Navigable
  stub today; the game engine and branding land in a later milestone.
- **El Farsante** — a social deduction party game with a cyberpunk-neon
  identity, multi-language (es/en/ca) and optional multi-device sync via
  Firebase (anonymous auth + Firestore).

The apps share the PWA shell and build infrastructure, but keep their own game
logic and palette; Sudokupado and Murdokupado also share the color-free design
system, while El Farsante keeps its own visual identity and adheres only to the
semantic color contract.

## Layout

```
pwarush/
├── apps/
│   ├── sudokupado/        # @pwarush/sudokupado — the mature Sudoku PWA
│   ├── murdokupado/       # @pwarush/murdokupado — Latin-square stub
│   └── elfarsante/        # @pwarush/elfarsante — social deduction party game
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
(vite-plugin-pwa factory + gesture lockdown CSS, plus runtime shell primitives
under `pwa/react`). See
[`packages/core/README.md`](./packages/core/README.md) for the module map and
[`packages/core/DESIGN.md`](./packages/core/DESIGN.md) for the color-free design
system; each app maps the semantic tokens to a concrete palette in its own
`DESIGN.md`.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **State Management:** Zustand with persistence.
- **Database:** Dexie.js (IndexedDB).
- **Animations:** Framer Motion. **Icons:** Lucide React.
- **Tooling:** npm workspaces.
- **Quality Gate:** Biome (lint & format), Vitest (unit & integration),
  Playwright (E2E, see [`apps/sudokupado/e2e/README.md`](./apps/sudokupado/e2e/README.md)).

## Development

### Requirements

The toolchain requires **Node 24** (pinned in `.nvmrc`), managed via
[**nvm**](https://github.com/nvm-sh/nvm). Node 25 leaks globals that break the
test suite and Node 20.x crashes the toolchain, so the version is enforced:
`engine-strict=true` (`.npmrc`) makes `npm` refuse to install under any other
major. Install nvm first, then bootstrap once:

```bash
make setup     # installs Node 24 via nvm (reads .nvmrc) and runs npm ci
```

The `Makefile` resolves the nvm-installed Node 24 and prepends it to `PATH` for
every target, so `make check`, `make e2e`, … always run under the right Node
without a manual `nvm use`. The git hooks (commit/push) load it the same way.

### Tasks

The root `Makefile` orchestrates the workspaces:

```bash
make setup     # one-time bootstrap: Node 24 (nvm) + install all workspaces
make install   # install all workspaces (npm ci)
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
- `tvalverde.github.io/pwarush/elfarsante/` — El Farsante (own PWA scope)

El Farsante needs the seven `VITE_FIREBASE_*` repository secrets at build time
(see `apps/elfarsante/.env.example`), and the Pages host must be listed in the
Firebase Auth authorized domains.

## Versioning

SemVer is managed at two independent levels: an annotated monorepo tag
(`vX.Y.Z`, mirrored by the root `package.json`) and a per-workspace version that
tracks each app/package independently. See `CLAUDE.md` for the full policy.

---

Developed with ❤️ by [Toni Valverde](https://github.com/tvalverde).
