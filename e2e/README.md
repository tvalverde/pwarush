# End-to-end testing

Playwright safety net that guards the SPA shell during the upcoming
monorepo extraction. The suite covers app shell, difficulty selection,
near-win completion, game-over conditions, persistence, lifecycle
hooks, hints, notes, settings persistence, history navigation, PWA
metadata and a visual regression baseline.

## Running locally

The suite runs inside the official Playwright container so snapshots
are byte-identical between local and CI runs. Install dependencies on
the host first (the container reuses `node_modules` via a bind mount):

```bash
make install   # only once or after dependency changes
make e2e       # functional + visual regression
```

Other targets:

```bash
make e2e-update   # regenerate visual snapshots after intended UI changes
make e2e-ui       # open Playwright UI mode (requires browser access)
make e2e-build    # build a local image extending the upstream Playwright one
```

Reports land in `playwright-report/` (HTML) and `test-results/` (traces,
videos, attachments). Both directories are gitignored.

## How seeding works

The SPA persists state in IndexedDB (`SudokupadoDB`) and `localStorage`
(`sudokupado-game-storage`). Tests must inject state before the React
app boots Dexie; otherwise the live connection blocks our writes.

Each test:

1. Navigates to `/pwarush/sudokupado/__e2e_bootstrap__`, a fake HTML page
   served by `page.route` on the same origin as the SPA.
2. Writes `localStorage` and recreates `SudokupadoDB` at Dexie's
   internal version (20) with the requested player, preferences and
   optional `gameState`.
3. Removes the route override and navigates to the real path.

The implementation lives in `helpers/seed.ts` and is exposed through
the `seedAndGoto` fixture in `helpers/page-setup.ts`.

## Determinism

- A single hand-verified Wikipedia puzzle (with a unique solution) is
  reused across all difficulty labels. The app does not enforce that
  puzzles match their declared difficulty, only that the label drives
  scoring.
- `helpers/disable-animations.css` zeroes every animation and
  transition; `matchMedia('prefers-reduced-motion: reduce')` is also
  mocked so Framer Motion settles instantly.
- Visual snapshots assume a Chromium running inside
  `mcr.microsoft.com/playwright:v1.60.0-noble` (matches CI). If you
  change the image tag, regenerate snapshots from CI.

## Pre-commit policy

The Husky pre-commit hook runs only the Vitest unit suite. Playwright
runs are reserved for CI and explicit `make e2e` invocations to avoid
slowing down everyday commits.

## Updating fixtures

If the Dexie schema changes (new tables, new fields), update
`helpers/seed.ts` accordingly: the bootstrap script recreates the
object stores from scratch, so any new table must be added there.
Fixtures with hand-coded puzzles live in `fixtures/puzzles.ts`; verify
new ones with the `countSolutions` snippet that originally validated
the baseline puzzle (Wikipedia entry, 30 hints, single solution).
