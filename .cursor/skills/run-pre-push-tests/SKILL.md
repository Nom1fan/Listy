---
name: run-pre-push-tests
description: Run all backend and frontend tests (the same suite that runs on git push). Use when the user asks to run all tests, verify everything passes, check pre-push tests, or fix test failures before a push or release.
---

# Run Pre-Push Tests

This project has a pre-push git hook (`.githooks/pre-push`) that runs **all backend and frontend tests** before every `git push`. The same script can be run manually.

## When to apply

- The user asks to "run all tests", "run pre-push tests", or "check if tests pass".
- A `git push` was rejected because tests failed and the user wants help fixing them.
- Before starting a release, to catch issues early.
- The user asks to "fix tests" or "make tests green".

## How to run

From the **project root**:

```bash
./scripts/run-all-tests.sh
```

This runs:
1. **Backend tests** — `cd backend && ./mvnw test -Dsurefire.useFile=false`
2. **Frontend tests** — `cd frontend && npx vitest run`

The script prints a clear PASSED/FAILED summary for each suite and exits non-zero if any suite fails.

### Flags

| Flag | Effect |
|------|--------|
| `--bail` | Stop after the first failing suite instead of running both |

## Fixing failures

When tests fail:

1. Run `./scripts/run-all-tests.sh` and read the output to identify which tests failed.
2. Fix the failing tests (or the code they test).
3. Re-run `./scripts/run-all-tests.sh` to confirm everything passes.
4. The user can then `git push` successfully.

For running individual test suites or single tests, see:
- **Backend**: `.cursor/skills/run-backend-tests/SKILL.md`
- **Frontend**: `.cursor/skills/run-frontend-tests/SKILL.md`

## Skipping the hook (emergency only)

```bash
git push --no-verify
```

This bypasses the pre-push hook. Only use in emergencies.

## Setup

The hook lives in `.githooks/pre-push` (tracked in git). It requires:
```bash
git config core.hooksPath .githooks
```
This is a per-repo setting. New clones need to run this once. Consider adding it to a setup script or README.

## Notes

- The script runs from the project root and uses `./mvnw` (backend) and `npx vitest` (frontend).
- Use `block_until_ms: 0` when running in shell — tests can take a few minutes. Monitor the terminal output for progress.
- Both suites run even if the first one fails (unless `--bail` is passed), so you see the full picture.
