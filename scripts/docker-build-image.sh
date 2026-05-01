#!/usr/bin/env bash
# Build (and optionally push) the Listyyy image for the version in ./VERSION.
#
# Easiest path if your laptop’s network intercepts HTTPS (corporate proxy): build on GitHub Actions
# (.github/workflows/docker-image.yml) — runners have clean TLS to registry.npmjs.org.
#
# Local build with your organization’s ROOT CA (PEM file IT gave you, or exported from Keychain):
#   ./scripts/docker-build-image.sh --ca /path/to/corp-root.pem --push
# Or:
#   export LISTYYY_DOCKER_CA=/path/to/corp-root.pem
#   ./scripts/docker-build-image.sh --push
#
# Local build without MITM (home Wi‑Fi / hotspot): CA not needed.
#   ./scripts/docker-build-image.sh --push
#
# Requires ./release.config with LISTYYY_IMAGE (see release.config.example).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

CA_FILE="${LISTYYY_DOCKER_CA:-}"
DO_PUSH=false  # set true by --push
NO_CACHE=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ca)
      CA_FILE="${2:-}"
      shift 2
      ;;
    --push) DO_PUSH=true; shift ;;
    --no-cache) NO_CACHE=(--no-cache); shift ;;
    -h|--help)
      grep '^#' "$0" | grep -v '^#!/' | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1 (try --help)" >&2
      exit 1
      ;;
  esac
done

if [[ -f "$REPO_ROOT/release.config" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/release.config"
  set +a
else
  echo "Missing release.config. Copy release.config.example to release.config and set LISTYYY_IMAGE." >&2
  exit 1
fi

: "${LISTYYY_IMAGE:?LISTYYY_IMAGE must be set in release.config}"

VERSION="$(cat "$REPO_ROOT/VERSION")"
TAG="${LISTYYY_IMAGE}:${VERSION}"

SECRET_ARGS=()
if [[ -n "${CA_FILE}" ]]; then
  if [[ ! -f "${CA_FILE}" ]]; then
    echo "CA file not found: ${CA_FILE}" >&2
    exit 1
  fi
  SECRET_ARGS=(--secret "id=npm-ca,src=${CA_FILE}")
fi

echo "Building ${TAG} ..."
# Avoid "${EMPTY[@]}" under `set -u` when arrays are empty (bash quirk).
_cmd=(docker build --platform linux/amd64)
[[ ${#NO_CACHE[@]} -gt 0 ]] && _cmd+=("${NO_CACHE[@]}")
[[ ${#SECRET_ARGS[@]} -gt 0 ]] && _cmd+=("${SECRET_ARGS[@]}")
_cmd+=(-t "${TAG}" -f "${REPO_ROOT}/Dockerfile" "${REPO_ROOT}")
"${_cmd[@]}"

if [[ "${DO_PUSH}" == true ]]; then
  echo "Pushing ${TAG} ..."
  docker push "${TAG}"
fi

echo "Done: ${TAG}"
