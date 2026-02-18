---
name: run-deploy
description: Deploy Listyyy to EC2 (copy compose file, pull Docker image, restart services). Use when the user asks to deploy, push to production, update EC2, re-deploy a specific version, or sync the database to EC2.
---

# Run Deploy

Run from the **project root**:

```bash
./scripts/deploy.sh [options]
```

## Options

| Option | Effect |
|--------|--------|
| *(none)* | Deploy the version in the `VERSION` file |
| `--version VERSION` | Deploy a specific version (e.g. `--version 0.3.0`) |
| `--db` | Also SCP the DB dump to EC2 and import it |

## Choosing options

- "deploy" with no qualifiers → no options (uses current VERSION).
- User specifies a version → `--version <version>`.
- User mentions deploying or syncing the database → add `--db`.

## Prerequisites

- `.env` must have `EC2_PEM` and `EC2_HOST` (already configured).
- `release.config` must have `LISTYYY_IMAGE` (already configured).
- The Docker image for the target version must already be pushed to the registry.

## Important

- Run from the project root so relative paths resolve correctly.
- SSH into EC2 can take 30–60s. Use `block_until_ms: 0` and monitor terminal output.
- This script does **not** bump versions, build images, or touch git — it only deploys what's already built.
