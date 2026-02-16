#!/usr/bin/env bash
# Run all backend and frontend tests.
# Exits 0 only if every suite passes.
#
# Usage: ./scripts/run-all-tests.sh [--bail]
#
#   --bail   Stop on the first suite that fails (default: run both, report all)
#
# Intended to be called from:
#   - .githooks/pre-push  (automatically before every git push)
#   - scripts/release.sh  (before building a release)
#   - manually at any time
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BAIL=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bail) BAIL=true; shift ;;
    *)      echo "Unknown option: $1"; exit 1 ;;
  esac
done

BACKEND_OK=true
FRONTEND_OK=true

# ── Backend tests ────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Running BACKEND tests  (./mvnw test)"
echo "════════════════════════════════════════════════════════════"
echo ""
cd "$REPO_ROOT/backend"
if ./mvnw test -Dsurefire.useFile=false; then
  echo ""
  echo "  ✓ Backend tests PASSED"
else
  BACKEND_OK=false
  echo ""
  echo "  ✗ Backend tests FAILED"
  if $BAIL; then
    echo ""
    echo "Bailing out (--bail). Fix backend tests before continuing."
    exit 1
  fi
fi

# ── Frontend tests ───────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Running FRONTEND tests  (npx vitest run)"
echo "════════════════════════════════════════════════════════════"
echo ""
cd "$REPO_ROOT/frontend"
if npx vitest run; then
  echo ""
  echo "  ✓ Frontend tests PASSED"
else
  FRONTEND_OK=false
  echo ""
  echo "  ✗ Frontend tests FAILED"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  TEST SUMMARY"
echo "════════════════════════════════════════════════════════════"
$BACKEND_OK  && echo "  Backend  ✓ PASSED" || echo "  Backend  ✗ FAILED"
$FRONTEND_OK && echo "  Frontend ✓ PASSED" || echo "  Frontend ✗ FAILED"
echo "════════════════════════════════════════════════════════════"

if $BACKEND_OK && $FRONTEND_OK; then
  echo ""
  echo "All tests passed!"
  exit 0
else
  echo ""
  echo "Some tests failed. Fix them before pushing / releasing."
  exit 1
fi
