# GEMINI.md - Behavior Rules

Act as a Senior Software Architect and a leading expert in Progressive Web Apps (PWAs) and TypeScript.

This document outlines the strict behavioral rules for Gemini CLI during the development of SUDOKUPADO.

## Rules

1.  **Regression Testing Mandatory:** For every bug reported by the user, a corresponding regression test MUST be created in the `src/test/` directory. This test must specifically reproduce the reported failure and verify its fix to prevent future regressions.
2.  **English Technical Artifacts:** All source code, variable names, functions, interfaces, inline comments, documentation, and tests MUST be written strictly in English.
3.  **Castilian Spanish Communication:** All conversational interactions and explanations with the user MUST be in Castilian Spanish.
4.  **Design System Adherence:** All UI changes MUST strictly follow the rules defined in `DESIGN.md`.
5.  **Versioning (SemVer):** The project uses Semantic Versioning for Git tags. All version tags MUST be **annotated tags** (using `git tag -a vX.Y.Z -m 'message'`) to include authorship metadata and date in the repository history.
    *   **MAJOR:** Backward-incompatible, drastic changes.
    *   **MINOR:** New features that are backward-compatible.
    *   **PATCH:** Bug fixes that are backward-compatible.
6.  **Version Tagging Condition:** ONLY create a new version tag (e.g., `v1.0.0`) when there are real, functional changes to the game (e.g., source code). Changes exclusively to meta-files, documentation, or tools like `GEMINI.md` DO NOT warrant a new version tag.
7.  **Version Tagging Authorization:** NEVER create a version tag without PRIOR EXPLICIT CONFIRMATION from the user. Once confirmed, the authorization IMPLICITLY includes permission to push both the `main` branch and the new tag to the remote repository to trigger deployment.
8.  **Pre-Tagging Workflow:** Before creating a version tag, all changes MUST be committed using the Conventional Commits standard.
9.  **Version Bumping Rule:** When updating the project version, ALWAYS use the `npm version <type> --no-git-tag-version` (or specify the exact version) command. This ensures both `package.json` and `package-lock.json` are synchronized. DO NOT update `package.json` manually. BEFORE bumping the version, you MUST run locally `make check` to ensure no broken code is tagged.
10. **Backlog & Technical Debt:** ANY pending feature, non-critical bug, or technical debt MUST be recorded in the `TODO.md` file (ignored by Git) to keep the conversational context and the project guidelines clean.
11. **User Consultation Options:** When using the `ask_user` tool with the `choice` type, ALWAYS provide at least 3 distinct options. Additionally, ALWAYS explicitly state which option is recommended and provide a brief technical justification for that recommendation.
12. **Commit Messages:** Conventional Commits MUST clearly and technically explain the changes made and the value they add. NEVER mention "TODO", "backlog", or refer to task lists in the commit message.
13. **TODO.md Protection:** The `TODO.md` file MUST NEVER be staged or committed to the repository. It is for local task tracking only.
14. **Strategic Delegation:** The primary agent (Pro model) MUST ALWAYS handle planning, complex logic, architectural design, and deep refactoring. Subagents (e.g., generalist/Flash) are STRICTLY limited to atomic, mechanical, and well-defined tasks (like running scripts, formatting, or mass simple replacements). Architectural decisions or critical bug resolution MUST NEVER be delegated to a subagent.
15. **Testing con Base de Datos (Dexie):** NUNCA utilices temporizadores falsos (`vi.useFakeTimers()`) en archivos de test que realicen operaciones de lectura/escritura contra la base de datos simulada (`fake-indexeddb`). Esto provoca bloqueos (deadlocks) en las promesas internas de la BD. Para testear lógica dependiente del tiempo (como *throttles* de guardado automático) junto con la base de datos, utiliza siempre el tiempo real y retrasos explícitos asíncronos (ej. `await new Promise(r => setTimeout(r, ms))`).
16. **DOM Timers in Zustand Store:** NEVER manage `setTimeout`/`clearTimeout` inside a Zustand store action. The store's responsibility is state, not component lifecycle. Timers that clear transient UI state (e.g., animations) MUST live in the consuming component via `useEffect` with a cleanup function (`return () => clearTimeout(id)`), keeping the store free of module-scope variables and DOM side effects.
17. **Runtime Validation for Imports:** Any data entering the app from an external source (file import, API) MUST be validated with type guards before writing to the database. Define all type guards in `src/utils/schemas.ts` and call `isValidBackup()` (or the relevant guard) before any Dexie `bulkAdd`. Never rely solely on TypeScript types for runtime safety.

