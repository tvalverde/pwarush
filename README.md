# SUDOKUPADO

SUDOKUPADO is a premium, minimalist, and offline-first Progressive Web App (PWA) for playing Sudoku. Designed with a "Zen Focus" philosophy, it offers a high-contrast, distraction-free experience optimized for both mobile and tablet devices.

## Features

- **Zen Experience:** Minimalist UI with smooth animations and high-contrast design.
- **Offline-First:** Fully functional without internet connection.
- **PWA Ready:** Install it on your Home Screen as a native app on Android and iOS.
- **Guest Mode:** Play instantly without registration or data storage.
- **Advanced Logic Engine:** Smart puzzle generation with guaranteed unique solutions and logical difficulty classification.
- **Privacy Centric:** All data (players, progress, trophies) is stored locally on your device.
- **Bilingual:** Full support for English and Castilian Spanish.
- **Data Portability:** Export and import your backup as a JSON file.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS.
- **State Management:** Zustand with Persistence.
- **Database:** Dexie.js (IndexedDB).
- **Animations:** Framer Motion.
- **Icons:** Lucide React.
- **Quality Gate:** Biome (Linter & Formatter), Vitest (Unit & Integration tests), Playwright (End-to-end tests, see `e2e/README.md`).

## Development

The project uses a `Makefile` to simplify common development tasks:

```bash
# Initial setup
make install

# Start development server
make dev

# Run quality checks (Lint, Typecheck, Tests)
make check

# Build for production
make build

# Run end-to-end suite (Playwright, inside the official container)
make e2e
```

See [`e2e/README.md`](./e2e/README.md) for details about the
end-to-end safety net.

---

Developed with ❤️ by [Toni Valverde](https://github.com/tvalverde).
