#!/usr/bin/env bash
# Build the Android App Bundle (.aab) for release.
# Uses VERSION from repo root; output is app-release-<version>.aab in
# frontend/android/app/build/outputs/bundle/release/.
#
# Prerequisites: Node, Android SDK (for gradle), and for signed release
# a keystore at keystore/keystore.properties (see DEV.md).
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION_FILE="$REPO_ROOT/VERSION"
VERSION=$(cat "$VERSION_FILE" | tr -d '\n' | tr -d ' ')
ANDROID_DIR="$REPO_ROOT/frontend/android"
BUNDLE_DIR="$ANDROID_DIR/app/build/outputs/bundle/release"
AAB_NAME="app-release-${VERSION}.aab"

echo "Building web bundle and syncing Capacitor ..."
cd "$REPO_ROOT/frontend"
npm run build
npx cap sync android

echo "Building release AAB ..."
cd "$ANDROID_DIR"
./gradlew bundleRelease

if [ -f "$BUNDLE_DIR/$AAB_NAME" ]; then
  echo "AAB built: $BUNDLE_DIR/$AAB_NAME"
else
  # Gradle renames in doLast; if not found, report the default name
  echo "AAB built: $BUNDLE_DIR/app-release.aab (or $AAB_NAME)"
fi
