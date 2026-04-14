# Screen Arxiv

**Your Personal Archive for Movies and TV Series.**

Screen Arxiv is a premium media tracking application designed for those who want a clean, aesthetic, and distraction-free way to archive their cinematic journey. Available as both a **web app** and a **React Native mobile app** (Android).

---

## Download

**[Download the latest Android APK from GitHub Releases](https://github.com/excellencior/screen-arxiv/releases)**

> **Installation Note:** This app is built and signed locally and is not yet registered on Google Play. During installation, your device may display a security warning (e.g., "Install unknown apps" or Google Play Protect alerts). This is standard behavior for any app distributed outside the Play Store and does not indicate a security issue. Google Play registration is planned for a future release.

---

## Features

### Movie Tracking
- Cinematic detail modals with full-bleed backdrop images, gradient fades, and floating typography
- Integrated trailer playback with a single tap
- Segmented status control for one-tap status changes between Watched, Watching, and Waitlist
- Horizontal scrolling cast carousel with profile photos

### TV Series and Episode Management
- Season navigation through a horizontal poster carousel
- Per-episode tracking with clean episode rows and tap-to-view detail modals
- Cinematic episode detail modals with individual status controls
- Quick actions to mark entire seasons or a full series as watched instantly
- Visual progress bars showing watched vs. remaining episodes per season

### Search and Discovery
- Full-text search powered by TMDB for movies and TV shows
- Quick Add to instantly add titles to your library with auto-fetched metadata and posters

### Insights and Analytics
- Library overview with total movie, series, and episode counts at a glance
- Decade distribution chart to see which eras of cinema you explore most
- Genre breakdown visualization to identify your favorite genres

### Backup and Restore
- JSON export to download your entire library as a portable backup file
- JSON import to restore from a backup with instant in-memory data loading (no restart required)

### User Experience
- Polestar-inspired aesthetic with cinematic dark mode and editorial typography
- Adaptive theming with dynamic Light and Dark modes and persistent preference
- Status-colored filter pills matching watch status for quick filtering
- Diagonal corner ribbons showing current watch status on posters
- Spring-based micro-animations on status changes and interactions
- Proper modal hierarchy navigation (Episode to Season to Show to List)
- Gesture-based swipe navigation between tabs

---

## Project Structure

```
screen-arxiv/
├── src/                    # Web app (React + Vite)
│   ├── components/         # UI components and modals
│   ├── context/            # React context providers
│   ├── pages/              # Page-level components
│   └── services/           # TMDB API services
├── mobileRN/               # Mobile app (React Native)
│   ├── src/
│   │   ├── screens/        # Screen components (Movies, TV, Search, Analytics, Backup)
│   │   ├── components/     # Shared components
│   │   ├── context/        # LibraryContext, ThemeContext, BackButtonContext
│   │   ├── services/       # TMDB API services
│   │   └── hooks/          # Custom hooks
│   └── android/            # Android native project
└── server/                 # Backend API server
```

---

## Built With

### Web
| Technology       | Purpose                                    |
|------------------|--------------------------------------------|
| React + Vite     | Fast, responsive interface                 |
| Bootstrap        | Layout and component framework             |
| Vanilla CSS      | Architectural styling and theming          |
| Framer Motion    | Premium interactions and animations        |
| Lucide React     | Consistent, meaningful iconography         |

### Mobile
| Technology                | Purpose                                    |
|---------------------------|--------------------------------------------|
| React Native 0.84         | Cross-platform mobile rendering           |
| React Navigation           | Bottom tabs with custom glassmorphic bar  |
| AsyncStorage               | Persistent local data storage             |
| Lucide React Native        | Iconography                               |
| React Native Toast Message | Theme-aware custom notifications          |

### Shared
| Technology | Purpose                              |
|------------|--------------------------------------|
| TMDB API   | Comprehensive global media database  |

---

## Getting Started

### Web App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Mobile App (Web Preview)

```bash
cd mobileRN
npm install

# Run web preview
npm run web
```

### Mobile App (Android APK)

#### Prerequisites
- **Node.js** v22.11.0 or later
- **Java JDK 17** (required by React Native 0.84)
- **Android SDK** with Build Tools, Platform Tools, and SDK Platform 35
- `ANDROID_HOME` environment variable set

#### Debug APK

```bash
cd mobileRN

# Install dependencies
npm install

# Build debug APK
cd android
./gradlew assembleDebug
```

The debug APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release APK

```bash
cd mobileRN/android

# Build release APK (uses debug keystore by default)
./gradlew assembleRelease
```

The release APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

> **Note**: For production distribution, generate your own signing keystore. See the [React Native Signed APK guide](https://reactnative.dev/docs/signed-apk-android).

---

*Keep archiving. Keep watching.*
