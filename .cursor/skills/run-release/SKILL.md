---
name: run-release
description: Run the full release pipeline (version bump, DB export, Docker build/push, git tag, deploy). Use when the user asks to release, cut a release, bump the version, publish, or ship a new version.
---

# Run Release

## When to apply

- The user asks to release, ship, publish, or cut a new version.
- The user says "bump the version" or "push a release".
- The user wants to build and push a Docker image for a new version.

## What to do

Run the release script from the **project root**:

```bash
./scripts/release.sh [flags]
```

### Flags

| Flag | Effect |
|------|--------|
| *(none)* | Bump version, export DB, build+push Docker image, git commit+tag+push, deploy to EC2 |
| `--db` | Also SCP the DB dump to EC2 and import it |
| `--windows` | Also build the Windows package and zip |
| `--skip-deploy` | Build and push only, skip EC2 deployment |

### Choosing flags

- Default (no flags) is the most common case.
- Ask the user if they want `--db`, `--windows`, or `--skip-deploy` only if their request is ambiguous. If they say "release" with no qualifiers, run with no flags.
- If the user explicitly mentions deploying the database, add `--db`.
- If the user says "don't deploy" or "build only", add `--skip-deploy`.

## Prerequisites

- `release.config` must have `LISTYYY_IMAGE` set (already configured in this project).
- `.env` must have `EC2_PEM` and `EC2_HOST` for deployment (already configured).
- Docker must be running locally.
- The script has interactive prompts for missing config on first run that won't work in a non-interactive shell—if config is missing, tell the user to set the values in `release.config` or `.env` first.

## Important

- Run from the project root so relative paths resolve correctly.
- The script bumps the **minor** version automatically (e.g. 0.2.0 -> 0.3.0). Do not bump the version manually before running.
- The script will `git commit`, `git tag`, and `git push` automatically. Warn the user that uncommitted changes outside of VERSION/pom.xml/package.json should be committed or stashed first.
- Use `block_until_ms: 0` when running in shell—the Docker build can take minutes. Monitor the terminal output to report progress and final status.
