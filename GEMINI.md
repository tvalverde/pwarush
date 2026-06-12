# CLAUDE.md — Behavior Rules

Act as a Senior Software Architect and a leading expert in Progressive Web Apps (PWAs) and TypeScript.

This document outlines the strict behavioral rules during the development of **PWARUSH** (monorepo with apps Sudokupado and Murdokupado, plus the shared `@pwarush/core` package).

## Rules

1.  **Regression Testing Mandatory:** For every bug reported by the user, a corresponding regression test MUST be created inside the test directory of the affected workspace (`apps/<app>/src/test/` for unit tests, `apps/<app>/e2e/specs/` for E2E). This test must specifically reproduce the reported failure and verify its fix to prevent future regressions.
2.  **English Technical Artifacts:** All source code, variable names, functions, interfaces, inline comments, documentation, and tests MUST be written strictly in English.
3.  **Castilian Spanish Communication:** All conversational interactions and explanations with the user MUST be in Castilian Spanish.
4.  **Design System Adherence:** All UI changes MUST strictly follow the rules defined in the relevant DESIGN.md. Per-app palette and concrete tokens live in `apps/<app>/DESIGN.md`. The shared system (shapes, typography, spacing, semantic tokens without color) lives in `packages/core/DESIGN.md` (extracted in Hito 4).
5.  **Versioning (SemVer):** The monorepo manages SemVer at **two independent levels**:
    - **Monorepo tag** (`vX.Y.Z`): reflects the version of the whole repo at a point in time. Each tag MUST be **annotated** (`git tag -a vX.Y.Z -m 'message'`). The root `package.json` (`pwarush`) MUST always have the same version as the most recent emitted tag (see rule 18).
    - **Per-workspace version** (`apps/*/package.json`, `packages/*/package.json`): reflects the real SemVer of THAT app or package, independently of the monorepo tag. It can legitimately diverge from the repo tag (e.g. tag `v0.3.0` with `apps/sudokupado@0.2.0` if Sudokupado did not change in that release).

    SemVer applies with the usual convention at both levels:
    *   **MAJOR:** backward-incompatible, drastic changes.
    *   **MINOR:** new features that are backward-compatible.
    *   **PATCH:** bug fixes that are backward-compatible.
6.  **Version Tagging Condition:** Only create a new monorepo tag when ANY workspace (`apps/*` or `packages/*`) or shared infrastructure (workflows, root configs) has real functional changes since the previous tag. Changes exclusively to meta-files or documentation (CLAUDE.md, root README.md, comments) DO NOT warrant a new monorepo tag.

    **Exception — major release milestones:** a deliberate major release that marks a project-wide milestone (e.g. `v1.0.0` for functional parity with the legacy `sudokupado` v1.9.x) MAY be tagged even when the delta since the previous tag is documentation-only. These are explicit, user-authorized release events, not the incidental doc/meta churn this rule guards against.

    Per workspace: the `version` of a workspace SHOULD only be bumped if its own folder has functional changes since the previous tag. Mechanical verification is mandatory before each bump (see rule 9).
7.  **Version Tagging Authorization:** NEVER create a version tag without PRIOR EXPLICIT CONFIRMATION from the user. Once confirmed, the authorization IMPLICITLY includes permission to push both the `main` branch and the new tag to the remote repository to trigger deployment.
8.  **Pre-Tagging Workflow:** Before creating a version tag, all changes MUST be committed using the Conventional Commits standard.
9.  **Version Bumping Rule (Monorepo):** Before each monorepo tag, follow this strict procedure in this exact order:

    **a) Identify which workspaces changed since the previous tag:**
    ```bash
    PREV_TAG=$(git describe --tags --abbrev=0)
    for ws in apps/sudokupado apps/murdokupado packages/core; do
      diff=$(git diff $PREV_TAG..HEAD --name-only -- "$ws/" | wc -l)
      untracked=$(git ls-files --others --exclude-standard "$ws/" | wc -l)
      total=$((diff + untracked))
      [ $total -gt 0 ] && echo "$ws CHANGED → bump required" || echo "$ws unchanged → keep version"
    done
    ```

    **b) Bump the workspaces that changed, using `npm version`:**
    ```bash
    npm version <vX.Y.Z> --no-git-tag-version --workspace=@pwarush/<name>
    ```
    NEVER edit the `version` field of a `package.json` by hand (breaks sync with `package-lock.json`).

    **c) ALWAYS bump the root to the `vX.Y.Z` of the monorepo tag:**
    ```bash
    npm version <vX.Y.Z> --no-git-tag-version
    ```
    The root `pwarush` always reflects the monorepo tag. It is bumped on every release without prior verification.

    **d) Run `make check` locally** to validate nothing broke with the version changes.

    **e) Commit with Conventional Commits (rule 8)**, e.g. `chore(repo): bump root to vX.Y.Z and <workspaces> to <versions>`.

    **f) Create the annotated tag (rules 5/7)** after explicit user confirmation.
10. **Backlog & Technical Debt:** ANY pending feature, non-critical bug, or technical debt MUST be recorded in the `TODO.md` file (ignored by Git) to keep the conversational context and the project guidelines clean.
11. **User Consultation Options:** When using the `ask_user` tool with the `choice` type, ALWAYS provide at least 3 distinct options. Additionally, ALWAYS explicitly state which option is recommended and provide a brief technical justification for that recommendation.
12. **Commit Messages:** Conventional Commits MUST clearly and technically explain the changes made and the value they add. NEVER mention "TODO", "backlog", or refer to task lists in the commit message.
13. **TODO.md Protection:** The `TODO.md` file MUST NEVER be staged or committed to the repository. It is for local task tracking only.
14. **Strategic Delegation (quota-aware):** The primary agent (Fable) MUST ALWAYS handle planning, architectural design, decision making, briefs, code review, integration, and micro-tasks (briefing a cold subagent costs more than doing a small task directly). The token-heavy field work MUST be delegated to **Opus 4.8** subagents, strictly under a precise brief written by the primary agent that includes the relevant plan/spec references and verifiable acceptance criteria (e.g. named tests passing):
    - **Implementation** of well-bounded plan phases (new modules, components, test suites described in a plan document).
    - **Evidence gathering** during diagnostics: the primary agent formulates the hypotheses and designs the investigation; the subagent executes it and reports findings; the primary agent interprets the evidence and owns the resolution.
    - **Heavy verification loops** (full E2E suites, snapshot regeneration) and mechanical mass changes.

    Subagents MUST NOT commit; the primary agent reviews every diff before integrating. Final judgment on architectural decisions and bug resolution MUST NEVER be delegated.
15. **Testing with Database (Dexie):** NEVER use fake timers (`vi.useFakeTimers()`) in test files that perform read/write operations against the simulated database (`fake-indexeddb`). It causes deadlocks in the internal DB promises. To test time-dependent logic (such as autosave throttles) alongside the database, always use real time and explicit asynchronous delays (e.g. `await new Promise(r => setTimeout(r, ms))`).
16. **DOM Timers in Zustand Store:** NEVER manage `setTimeout`/`clearTimeout` inside a Zustand store action. The store's responsibility is state, not component lifecycle. Timers that clear transient UI state (e.g., animations) MUST live in the consuming component via `useEffect` with a cleanup function (`return () => clearTimeout(id)`), keeping the store free of module-scope variables and DOM side effects.
17. **Runtime Validation for Imports:** Any data entering the app from an external source (file import, API) MUST be validated with type guards before writing to the database. Define all type guards in `apps/<app>/src/utils/schemas.ts` and call `isValidBackup()` (or the relevant guard) before any Dexie `bulkAdd`. Never rely solely on TypeScript types for runtime safety.
18. **Monorepo Version Coherence:** The `version` of the root `package.json` (`pwarush`) MUST always match the most recent emitted tag of the repo. Any divergence indicates a bug in the bump workflow (e.g. tag created without bumping the root, or bump without subsequent tag). Quick verification before any release:
    ```bash
    test "v$(node -p "require('./package.json').version")" = "$(git describe --tags --abbrev=0)" \
      && echo "✅ root coherent with last tag" \
      || echo "❌ root version DRIFTS from last tag"
    ```
    If the check fails and you are NOT in the middle of a release workflow: stop and diagnose before proceeding.
