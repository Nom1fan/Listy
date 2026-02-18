---
name: run-frontend-tests
description: Run frontend (React/Vitest) tests. Use when running frontend tests, verifying UI test results, or executing vitest commands. NOT for backend tests — see run-backend-tests instead.
---

# Running Frontend Tests

Uses Vitest with jsdom and React Testing Library. Tests live alongside source files as `*.test.tsx` / `*.test.ts`.

## Commands

Always run from `frontend/` working directory.

**All tests:**
```bash
npx vitest run
```

**Single file:**
```bash
npx vitest run src/pages/ListDetail.test.tsx
```

**Name pattern:**
```bash
npx vitest run -t "quick-add"
```

**Watch mode:**
```bash
npx vitest
```

## Notes

- Working directory must be `frontend/`.
- Use `npx vitest run` (not `npm test`) for direct control over flags.
- Pipe through `| tail -30` for quick pass/fail summary when output is long.
- Config lives in `frontend/vite.config.ts` under the `test` key (jsdom environment, globals enabled).
- Setup file: `frontend/src/test/setup.ts` (imports `@testing-library/jest-dom`).
