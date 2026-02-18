---
name: run-release
description: Run the full release pipeline (version bump, DB export, Docker build/push, git tag, deploy). Use when the user asks to release, cut a release, bump the version, publish, ship a new version, or do a hotfix/patch release.
---

# Run Release

Run from the **project root**:

```bash
./scripts/release.sh [flags]
```

## Flags

| Flag | Effect |
|------|--------|
| *(none)* | Bump **minor** (e.g. 0.10.0 -> 0.11.0), run tests, export DB, build+push Docker, git commit+tag+push, deploy to EC2 |
| `--major` | Bump **major** instead (e.g. 0.10.0 -> 1.0.0) |
| `--patch` | Bump **patch** instead (e.g. 0.10.0 -> 0.10.1) |
| `--db` | Also SCP the DB dump to EC2 and import it |
| `--windows` | Also build the Windows package and zip |
| `--skip-deploy` | Build and push only, skip EC2 deployment |
| `--skip-tests` | Skip running tests before the release (not recommended) |

## Choosing flags

- Default (no flags) bumps minor — the most common case.
- "major release", "v1.0", "breaking change" → `--major`.
- "hotfix", "bugfix", "patch" → `--patch`.
- User mentions deploying the database → add `--db`.
- "don't deploy" or "build only" → `--skip-deploy`.
- If ambiguous, ask about `--db`, `--windows`, or `--skip-deploy`.

## Prerequisites

- `release.config` must have `LISTYYY_IMAGE` set (already configured).
- `.env` must have `EC2_PEM` and `EC2_HOST` for deployment (already configured).
- Docker must be running locally.

## Important

- Run from the project root so relative paths resolve correctly.
- The script auto-bumps the version — do not bump manually before running.
- The script runs `git commit`, `git tag`, and `git push` automatically. Warn the user to commit or stash unrelated changes first.
- Use `block_until_ms: 0` — Docker build can take minutes. Monitor terminal output.
