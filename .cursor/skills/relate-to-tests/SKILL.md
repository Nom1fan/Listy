---
name: relate-to-tests
description: Ensure code changes are accompanied by relevant tests. Use on EVERY code change — whether adding features, fixing bugs, or refactoring. Find existing tests, update or create tests to cover the change, and run them to verify they pass. This skill applies automatically whenever production code is modified.
---

# Relate to Tests

When making any code change, always address the test side of that change.

## Workflow

1. **Identify affected tests** — search for existing test files covering the modified code.
   - Backend: test classes typically live in `src/test/java/` mirroring the main source tree.
   - Frontend: test files live alongside source files as `*.test.tsx` / `*.test.ts`.

2. **Decide what to do:**
   - **Existing tests cover the change** — update them to reflect new behavior.
   - **No tests exist** — create new tests following the project's existing patterns.
   - **Refactor only (no behavior change)** — run existing tests to confirm nothing broke.

3. **Run the relevant tests** to verify they pass.
   - Use the `run-frontend-tests` or `run-backend-tests` skill for execution commands.
   - Fix any failures before considering the change complete.

## Guidelines

- Prefer small, focused test cases over large monolithic ones.
- Test the behavior that changed, not implementation details.
- When creating new test files, follow the naming and structure conventions already used in the project.
- Do not skip running the tests — a change is not done until its tests pass.
