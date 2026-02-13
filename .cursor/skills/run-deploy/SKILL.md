---
name: run-deploy
description: Deploy Listy to EC2 (copy compose file, pull Docker image, restart services). Use when the user asks to deploy, push to production, update EC2, or re-deploy a specific version.
---

# Run Deploy

## When to apply

- The user asks to deploy, push to production, or update the EC2 server.
- The user wants to re-deploy the current or a specific version without doing a full release.
- The user asks to sync the database to EC2.

## What to do

Run the deploy script from the **project root**:

```bash
./scripts/deploy.sh [options]
```

### Options

| Option | Effect |
|--------|--------|
| *(none)* | Deploy the version in the `VERSION` file |
| `--version VERSION` | Deploy a specific version (e.g. `--version 0.3.0`) |
| `--db` | Also SCP the DB dump to EC2 and import it |

### Choosing options

- If the user just says "deploy", run with no options (uses current VERSION).
- If they specify a version, pass `--version <version>`.
- If they mention deploying or syncing the database, add `--db`.

## Prerequisites

- `.env` must have `EC2_PEM` and `EC2_HOST` (already configured in this project).
- `release.config` must have `LISTY_IMAGE` (already configured).
- The Docker image for the target version must already be pushed to the registry.
- The script has interactive prompts for missing config that won't work in a non-interactive shell—if config is missing, tell the user to set values in `.env` or `release.config` first.

## Important

- Run from the project root so relative paths resolve correctly.
- This script SSHs into EC2 to pull the image and restart. It can take 30–60 seconds. Use `block_until_ms: 0` and monitor the terminal output to report progress and final status.
- Unlike `release.sh`, this does **not** bump versions, build Docker images, or touch git. It only deploys what's already built.
