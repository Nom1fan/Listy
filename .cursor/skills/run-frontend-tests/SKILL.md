---
name: run-frontend-tests
description: Run frontend (React/Vitest) tests. Use when running frontend tests, verifying UI test results, or executing vitest commands. NOT for backend tests — see run-backend-tests instead.
---

# Running Frontend Tests

This project uses Vitest with jsdom and React Testing Library. Tests live alongside source files as `*.test.tsx` / `*.test.ts`.

## Commands

Always run from the `frontend/` working directory.

**Run all tests:**
```bash
npx vitest run
```

**Run tests for a single file:**
```bash
npx vitest run src/pages/ListDetail.test.tsx
```

**Run tests matching a name pattern:**
```bash
npx vitest run -t "quick-add"
```

**Watch mode (re-runs on file changes):**
```bash
npx vitest
```

## Notes

- Working directory must be `frontend/`.
- Use `npx vitest run` (not `npm test`) for direct control over flags.
- Pipe through `| tail -30` for a quick pass/fail summary when output is long.
- Config lives in `frontend/vite.config.ts` under the `test` key (jsdom environment, globals enabled).
- Setup file: `frontend/src/test/setup.ts` (imports `@testing-library/jest-dom`).
