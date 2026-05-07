#!/usr/bin/env bash
# Full release: bump version, git commit + tag + push, wait for CI Docker build, deploy to EC2.
# Docker image is built and pushed by .github/workflows/docker-image.yml on push to main.
# Optionally build Android App Bundle (.aab).
#
# Usage: ./scripts/release.sh [--major|--patch] [--aab] [--skip-deploy] [--skip-tests]
#
# Flags:
#   --major           Bump major version (e.g. 0.10.0 -> 1.0.0)
#   --patch           Bump patch version (e.g. 0.10.0 -> 0.10.1)
#   (default)         Bump minor version (e.g. 0.10.0 -> 0.11.0)
#   --aab             Also build the Android App Bundle (.aab)
#   --skip-deploy     Skip EC2 deployment (build and push only)
#   --skip-tests      Skip running tests before release
#
# Config:
#   release.config    LISTYYY_IMAGE (Docker Hub repo, e.g. mmerhav/listyyy)
#   .env              EC2_PEM, EC2_HOST (for deployment); JWT_SECRET
#
# Run from repo root.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION_FILE="$REPO_ROOT/VERSION"

# ── Parse flags ──────────────────────────────────────────────
BUILD_AAB=false
SKIP_DEPLOY=false
SKIP_TESTS=false
BUMP_TYPE=minor
while [[ $# -gt 0 ]]; do
  case "$1" in
    --major)         BUMP_TYPE=major; shift ;;
    --patch)         BUMP_TYPE=patch; shift ;;
    --aab)           BUILD_AAB=true; shift ;;
    --skip-deploy)   SKIP_DEPLOY=true; shift ;;
    --skip-tests)    SKIP_TESTS=true; shift ;;
    *)               echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Load config files
if [ -f "$REPO_ROOT/release.config" ]; then
  set -a; source "$REPO_ROOT/release.config"; set +a
fi
if [ -f "$REPO_ROOT/.env" ]; then
  set -a; source "$REPO_ROOT/.env"; set +a
fi

# ── Interactive setup (first run) ────────────────────────────
if [ -z "${LISTYYY_IMAGE:-}" ]; then
  echo "LISTYYY_IMAGE is not configured (needed to push Docker images)."
  echo "  Example: your-username/listyyy  or  ghcr.io/yourorg/listyyy"
  read -rp "  Image name: " LISTYYY_IMAGE
  if [ -n "$LISTYYY_IMAGE" ]; then
    echo "LISTYYY_IMAGE=$LISTYYY_IMAGE" > "$REPO_ROOT/release.config"
    echo "  Saved to release.config"
  fi
fi

# ── Pre-flight: check for unreleased changes ─────────────────
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
if [ -n "$LAST_TAG" ]; then
  UNRELEASED=$(git log --oneline "$LAST_TAG"..HEAD)
  if [ -z "$UNRELEASED" ]; then
    echo "No changes since $LAST_TAG — nothing to release."
    exit 0
  fi
  COMMIT_COUNT=$(echo "$UNRELEASED" | wc -l | tr -d ' ')
  echo "=== $COMMIT_COUNT unreleased commit(s) since $LAST_TAG ==="
  echo "$UNRELEASED"
  echo ""
fi

# ── 0. Run tests ─────────────────────────────────────────────
if ! $SKIP_TESTS; then
  echo "=== 0. Running all tests ==="
  "$SCRIPT_DIR/run-all-tests.sh"
  echo ""
else
  echo "=== 0. Running all tests (SKIPPED -- --skip-tests) ==="
  echo ""
fi

# ── 1. Bump version ─────────────────────────────────────────
current=$(cat "$VERSION_FILE")
IFS=. read -r major minor patch <<EOF
$current
EOF
case "$BUMP_TYPE" in
  major) new_version="$((major + 1)).0.0" ;;
  patch) new_version="$major.$minor.$((patch + 1))" ;;
  *)     new_version="$major.$((minor + 1)).0" ;;
esac
echo "$new_version" > "$VERSION_FILE"
echo "=== 1. Bump version ($BUMP_TYPE): $current -> $new_version ==="
# Update pom.xml (project version, not parent)
sed -i.bak "s|<version>${current}-SNAPSHOT</version>|<version>${new_version}-SNAPSHOT</version>|" "$REPO_ROOT/backend/pom.xml" && rm -f "$REPO_ROOT/backend/pom.xml.bak"
# Update package.json
node -e "
const p = require(\"$REPO_ROOT/frontend/package.json\");
p.version = \"$new_version\";
require('fs').writeFileSync(\"$REPO_ROOT/frontend/package.json\", JSON.stringify(p, null, 2) + '\n');
"
echo ""

# ── 2. Build Android App Bundle (optional) ────────────────────
if $BUILD_AAB; then
  echo "=== 2. Build Android App Bundle (.aab) ==="
  "$SCRIPT_DIR/build-aab.sh"
else
  echo "=== 2. Build Android App Bundle (SKIPPED -- pass --aab to include) ==="
fi
echo ""

# ── 3. Git commit, tag, push (triggers CI Docker build) ────
echo "=== 3. Git commit and tag ==="
cd "$REPO_ROOT"
git add VERSION backend/pom.xml frontend/package.json
git commit -m "Release $new_version"
git tag "v$new_version"
git push && git push origin "v$new_version"
echo "Committed and tagged v$new_version"
echo ""

# ── 4. Wait for CI to build & push the Docker image ─────────
# Image is built by .github/workflows/docker-image.yml on push to main.
if [ -n "${LISTYYY_IMAGE:-}" ] && command -v gh >/dev/null 2>&1; then
  echo "=== 4. Waiting for CI Docker image build (${LISTYYY_IMAGE}:${new_version}) ==="
  # Give GitHub a moment to register the run, then watch it.
  sleep 5
  RUN_ID=$(gh run list --workflow=docker-image.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)
  if [ -n "$RUN_ID" ]; then
    gh run watch "$RUN_ID" --exit-status
    echo "CI build complete: ${LISTYYY_IMAGE}:${new_version}"
  else
    echo "Could not locate CI run; check Actions tab manually before deploying."
    exit 1
  fi
elif [ -n "${LISTYYY_IMAGE:-}" ]; then
  echo "=== 4. Docker image build (CI) ==="
  echo "  gh CLI not installed -- cannot wait on CI."
  echo "  Watch https://github.com/<owner>/<repo>/actions and re-run deploy with:"
  echo "    ./scripts/deploy.sh --version $new_version"
  exit 0
else
  echo "=== 4. Docker image build (SKIPPED -- LISTYYY_IMAGE not set) ==="
fi
echo ""

# ── 5. Deploy to EC2 ────────────────────────────────────────
if ! $SKIP_DEPLOY && [ -n "${EC2_PEM:-}" ] && [ -n "${EC2_HOST:-}" ]; then
  echo "=== 5. Deploy to EC2 ==="
  "$SCRIPT_DIR/deploy.sh" --version "$new_version"
elif $SKIP_DEPLOY; then
  echo "=== 5. Deploy to EC2 (SKIPPED) ==="
else
  echo "=== 5. Deploy to EC2 (SKIPPED -- set EC2_PEM and EC2_HOST in .env) ==="
fi
echo ""

# ── Summary ──────────────────────────────────────────────────
echo "========================================================"
echo "  Release $new_version complete!"
if $BUILD_AAB; then
  echo "  Android:  frontend/android/app/build/outputs/bundle/release/app-release-${new_version}.aab"
fi
if [ -n "${LISTYYY_IMAGE:-}" ]; then
  echo "  Docker:   ${LISTYYY_IMAGE}:${new_version} (built by GH Actions)"
fi
if ! $SKIP_DEPLOY && [ -n "${EC2_PEM:-}" ] && [ -n "${EC2_HOST:-}" ]; then
  echo "  EC2:      deployed to $EC2_HOST"
fi
echo "========================================================"
