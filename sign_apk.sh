#!/bin/bash

# Configuration
PROJECT_ROOT="$(pwd)"
ANDROID_PROJECT="$PROJECT_ROOT/mobile/android"
APK_INPUT="$ANDROID_PROJECT/app/build/outputs/apk/release/app-release-unsigned.apk"
APPS_DIR="$PROJECT_ROOT/apps"
KEYSTORE_PATH="$PROJECT_ROOT/release-key.keystore"
KEY_ALIAS="screenarxiv"
KEY_PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting APK build, signing, and export process...${NC}\n"

# 1. Build the Release APK (assembleRelease builds .apk, bundleRelease builds .aab)
echo "Building release APK using Gradle..."
cd "$ANDROID_PROJECT" || exit
./gradlew assembleRelease
cd "$PROJECT_ROOT" || exit

if [ ! -f "$APK_INPUT" ]; then
    echo -e "${RED}Error: Unsigned APK not found at $APK_INPUT${NC}"
    echo "Make sure the build was successful."
    exit 1
fi

# 2. Check for Keystore, create if missing
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "\nKeystore not found. Generating a new one at $KEYSTORE_PATH..."
    keytool -genkey -v \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEY_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=Screen Arxiv, OU=Engineering, O=Screen Arxiv, L=Unknown, S=Unknown, C=US"
    echo -e "${GREEN}Keystore generated successfully.${NC}"
fi

# 3. Create /apps destination directory
if [ ! -d "$APPS_DIR" ]; then
    mkdir -p "$APPS_DIR"
fi

# Determine Android build-tools path to use zipalign and apksigner
if [ -z "$ANDROID_HOME" ]; then
    # Parse from local.properties if it exists
    if [ -f "$ANDROID_PROJECT/local.properties" ]; then
        ANDROID_HOME=$(grep '^sdk\.dir=' "$ANDROID_PROJECT/local.properties" | cut -d'=' -f2)
    fi
    
    # Fallback common Linux path
    if [ -z "$ANDROID_HOME" ]; then
        ANDROID_HOME="$HOME/Android/Sdk"
    fi
fi

BUILD_TOOLS_DIR=$(ls -d "$ANDROID_HOME"/build-tools/* 2>/dev/null | tail -1)
if [ -z "$BUILD_TOOLS_DIR" ]; then
    echo -e "${RED}Error: Android build-tools not found at $ANDROID_HOME. Please set ANDROID_HOME correctly.${NC}"
    exit 1
fi

ZIPALIGN="$BUILD_TOOLS_DIR/zipalign"
APKSIGNER="$BUILD_TOOLS_DIR/apksigner"

ALIGNED_APK="$PROJECT_ROOT/mobile/android/app/build/outputs/apk/release/app-release-aligned.apk"
FINAL_APK="$APPS_DIR/screen-arxiv-release.apk"

# 4. Zipalign the APK
echo -e "\nZipaligning the APK..."
rm -f "$ALIGNED_APK"
"$ZIPALIGN" -v -p 4 "$APK_INPUT" "$ALIGNED_APK" >/dev/null

if [ ! -f "$ALIGNED_APK" ]; then
    echo -e "${RED}Error: Zipalign failed.${NC}"
    exit 1
fi

# 5. Sign the APK
echo "Signing the APK..."
"$APKSIGNER" sign --ks "$KEYSTORE_PATH" \
    --ks-key-alias "$KEY_ALIAS" \
    --ks-pass "pass:$KEY_PASSWORD" \
    --key-pass "pass:$KEY_PASSWORD" \
    --out "$FINAL_APK" \
    "$ALIGNED_APK"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Success! Signed APK is ready at:${NC}"
    echo "$FINAL_APK"
else
    echo -e "\n${RED}Error: APK signing failed.${NC}"
    exit 1
fi

# Cleanup intermediate file
rm -f "$ALIGNED_APK"
