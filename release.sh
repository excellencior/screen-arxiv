#!/bin/bash
set -e

VERSION="${1:?Usage: ./release.sh <version> (e.g. v1.0.0)}"
APK_PATH="mobileRN/release/ScreenArxiv-release.apk"

if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK not found at $APK_PATH"
  echo "Build the APK first, then place it at the expected path."
  exit 1
fi

echo "Creating release $VERSION with $APK_PATH..."

gh release create "$VERSION" "$APK_PATH" \
  --title "Screen Arxiv $VERSION" \
  --notes "## Screen Arxiv $VERSION

### Download
Download **ScreenArxiv-release.apk** below to install on your Android device.

### What's Inside
- Full movie and TV series tracking with cinematic detail modals
- Season and episode management with visual progress tracking
- Integrated trailer playback
- TMDB-powered search with instant library additions
- Analytics dashboard with decade and genre breakdowns
- JSON backup and restore
- Adaptive light and dark themes with spring-based animations
- Gesture-based swipe navigation between tabs

### Installation
1. Download the APK file from the assets below
2. Open it on your Android device
3. If prompted, enable \"Install from unknown sources\" in your device settings

> **Security Note:** This app is built and signed locally and is not yet listed on Google Play. Your device may display a security warning during installation (such as a Google Play Protect alert). This is standard behavior for apps distributed outside the Play Store and does not indicate any security risk. Google Play registration is planned for a future release."

echo "Release $VERSION created successfully."
echo "View it at: https://github.com/excellencior/screen-arxiv/releases/tag/$VERSION"
