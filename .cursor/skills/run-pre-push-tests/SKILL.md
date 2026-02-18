---
name: run-pre-push-tests
description: Run all backend and frontend tests (the same suite that runs on git push). Use when the user asks to run all tests, verify everything passes, check pre-push tests, fix test failures before a push or release, or make tests green.
---

# Run Pre-Push Tests

A pre-push git hook (`.githooks/pre-push`) runs all tests before every `git push`. The same script can be run manually.

## How to run

From the **project root**:

```bash
./scripts/run-all-tests.sh
```

Runs in order:
1. **Backend tests** — `cd backend && ./mvnw test -Dsurefire.useFile=false`
2. **Frontend tests** — `cd frontend && npx vitest run`

Prints a PASSED/FAILED summary for each suite and exits non-zero if any suite fails.

## Flags

| Flag | Effect |
|------|--------|
| `--bail` | Stop after the first failing suite |

## Fixing failures

1. Run the script and read output to identify failures.
2. Fix the failing tests or the code they test.
3. Re-run to confirm everything passes.

## Skipping the hook (emergency only)

```bash
git push --no-verify
```

## Notes

- Use `block_until_ms: 0` — tests can take a few minutes. Monitor terminal output.
- Both suites run even if the first fails (unless `--bail`), so you see the full picture.
- For individual suites, see `run-backend-tests` or `run-frontend-tests` skills.
