# El Farsante 🕵️‍♂️

A stylish, Cyber-Noir themed hidden role game designed for local play on a single shared device. Built with React, TypeScript, and Firebase.

## 🎮 About the Game

**El Farsante** (The Impostor) is a social deduction game where players must identify the liar among them. One or two players are secretly assigned the role of "The Impostor" while the rest are "Innocents."

- **The Innocents:** Know a secret word from a chosen category. They must describe it subtly enough so the Impostor doesn't guess it, but clearly enough to prove their innocence to others.
- **The Impostor:** Does not know the word. Their goal is to blend in, mimic the others, and avoid being caught. If they survive or guess the word, they win.

## ✨ Key Features

- **☁️ Cloud Persistence (v2.0):** Sync your player statistics (Infamy History), used words, and active game states across multiple devices using a unique **Sync Code**.
- **📱 Immersive PWA:** Install the game on your mobile device for a full-screen experience. Includes smart detection to hide system bars and orientation locks for maximum focus.
- **🔄 Dynamic "Random" Category:** A special mode that picks a different real category each round to keep everyone on their toes.
- **🛑 Zero Native Alerts:** Custom-built `NeonModal` and `CyberToast` systems replace all browser dialogues for complete thematic immersion.
- **⚖️ Weighted Fairness:** Advanced selection logic reduces consecutive Farsante repeats in small groups while maintaining total secrecy.
- **🛠️ Advanced Game Settings:**
  - **Round Timer:** Customizable durations.
  - **Impostor Count:** Support for multiple impostors in larger groups.
  - **Hardcore Mode:** Blind timer and time penalties for wrong eliminations.
- **🎨 Cyber-Noir Aesthetic:** Deep blacks, electric cyans, and neon reds driven by a unified `DESIGN.md` specification.

## 🛠️ Technical Stack

- **Framework:** [React 19](https://react.dev/)
- **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore & Anonymous Auth)
- **Bundler:** [Vite 8](https://vite.dev/) with manual chunk splitting for performance.
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** React Context + `useReducer` with real-time cloud synchronization.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the pwarush monorepo:

   ```bash
   git clone https://github.com/tvalverde/pwarush.git
   cd pwarush
   ```

2. Install dependencies from the repo root:

   ```bash
   npm install
   ```

3. Create a `.env.local` file inside `apps/elfarsante/` with your Firebase configuration (use `apps/elfarsante/.env.example` as a template):

   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ...
   ```

4. Start the development server from the repo root:
   ```bash
   npm run dev --workspace=@pwarush/elfarsante
   ```

### Deployment

El Farsante is part of the **pwarush monorepo** (workspace `@pwarush/elfarsante`) and is deployed automatically via the monorepo's tag-triggered GitHub Pages workflow. The app is served at base path `/pwarush/elfarsante/`. No manual deploy step is needed; push a monorepo tag to trigger the pipeline.

## Architecture & Game Logic Notes

### Do: State Persistence & Sync

- **Do use Cloud Persistence:** The game features Cloud Persistence via Firebase. Player statistics, used words, and active game states are synchronized with the cloud using a **Sync Code** system.
- **Do use Lazy Initialization:** Always initialize `useReducer` or `useState` that depends on `localStorage` using a lazy initializer function to avoid hydration mismatches.
- **Do maintain Persistent Word History:** Keep a history of used words in `state.usedWords`, mapped by category. Trigger `CLEAR_CATEGORY_WORDS` when a list is exhausted. Add words to history only when transitioning to the `PUNTUACIONES` phase.

### Do: Player & Role Management

- **Do use Stable IDs:** Attempt to preserve player IDs and Scores from the previous round by matching names in the state.
- **Do use Weighted Fairness (3 Players):** Use a weighted system (1 ticket for previous Farsante, 4 for others) to reduce consecutive repeats to ~11%. Use pure randomness for > 3 players.
- **Do respect Score Integrity:** Preserve scores when moving from `PUNTUACIONES` to `HOME` for Free Mode rounds.
- **Do manage Tournament Transitions:** In Tournament Mode (`scoreLimit !== null`), intercept `handleStartGame` with a warning if any player has `score > 0`. Upon tournament completion, present a victory modal to choose between a full reset or transitioning to Free Mode (preserving scores and setting `scoreLimit: null`).
- **Do delay Identity Revelation:** In the `RESULTADO` phase, only reveal the identity of the Farsantes if the game ends (e.g., Farsantes win by numbers).
- **Do limit Player Names:** Player names must be limited to **15 characters**. Use `maxLength={15}`.

### Do: UX and Hardware Integration

- **Do use Phase-Based Navigation:** The app is a SPA driven by a `Phase` string in the global state. Always perform a `window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })` when `currentPhase` changes.
- **Do maintain Sticky UX:** Use the "sticky bottom" pattern for primary action buttons with `fixed` positioning and `pb-[120px]` or `pb-[180px]` on scrollable content.
- **Do enforce Immersive Mobile UX:** Trigger `document.documentElement.requestFullscreen({ navigationUI: 'hide' })` for mobile devices regardless of standalone mode. Use vendor-specific meta tags (`x5-fullscreen`, `full-screen`, `browsermode`).
- **Do utilize Wake Lock:** Use the `useWakeLock` hook to prevent the screen from turning off during the `DEBATE` phase.
- **Do provide Audio Fallbacks:** Sound playback requires prior user interaction. Use the Web Audio API as a synthetic fallback if MP3 files are missing.
- **Do distinguish 'Aleatorio':** The "Aleatorio" category must be visually distinct (e.g., solid background vs. outline).

### Don't: Common Pitfalls

- **Don't use hardcoded Role IDs:** The `round.farsanteIds` array must always be derived from the actual IDs assigned to players.
- **Don't reset State on Mount:** Never set initial state in `useEffect` if a save-to-storage `useEffect` is also active.
- **Don't orphan Categories:** Ensure new categories in `dictionary.ts` are registered in `AVAILABLE_CATEGORIES` in `HomeScreen.tsx`.
- **Don't allow duplicate names:** Always validate name uniqueness before starting a game.

## 📜 License

This project is open-source and available under the MIT License.
