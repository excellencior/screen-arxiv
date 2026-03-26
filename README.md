# Screen Arxiv 🎬

**Your Personal Archive for Movies and TV Series.**

Screen Arxiv is a premium media tracking application designed for those who want a clean, aesthetic, and distraction-free way to archive their cinematic journey. Available as both a **web app** and a **React Native mobile app** (Android).

---

## ✨ Features

### 🎞️ Movie Tracking
- **Cinematic Detail Modals** with full-bleed backdrop images, gradient fades, and floating typography.
- **Trailer Integration** — watch trailers with a single tap.
- **Segmented Status Control** — one-tap status changes between *Watched*, *Watching*, and *Waitlist*.
- **Cast & Crew** — horizontal scrolling cast carousel with profile photos.

### 📺 TV Series & Episodes
- **Season Management** — horizontal poster carousel for season navigation.
- **Episode Tracking** — clean episode rows with tap-to-view detail modals.
- **Deep-Linked Episode Details** — cinematic episode modals with status controls.
- **Quick Actions** — mark entire seasons or the whole series as watched instantly.
- **Progress Tracking** — visual progress bars showing watched vs. remaining episodes.

### 📊 Insights & Analytics
- **Library Overview** — total movies, series, and episode counts at a glance.
- **Decade Distribution** — discover which eras of cinema you explore the most.
- **Genre Breakdown** — identify your favorite genres through visual charts.

### 🔍 Integrated Search
- Powered by **TMDB**, find any movie or show in seconds.
- **Quick Add** — add to your library instantly with auto-fetched metadata and posters.

### 💾 Backup & Restore
- **JSON Export** — download your entire library as a portable backup file.
- **JSON Import** — restore from a backup with instant in-memory data loading (no restart required).

### 🎨 Premium Experience
- **Polestar-Inspired Aesthetic** — cinematic dark mode with editorial typography.
- **Adaptive Theme** — dynamic Light and Dark modes with persistent preference.
- **Status-Colored Filters** — color-coded filter pills matching watch status.
- **Status Ribbons** — diagonal corner badges showing current watch status.
- **Smooth Motion** — spring-based micro-animations on status changes and interactions.
- **Back Button Navigation** — proper modal hierarchy navigation (Episode → Season → Show → List).

---

## 🏗️ Project Structure

```
screen-arxiv/
├── src/                    # Web app (React + Vite)
│   ├── components/         # UI components & modals
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

## 🛠️ Built With

### Web
- **React** & **Vite** for a fast, responsive interface.
- **Bootstrap** & **Vanilla CSS** for clean architectural styling.
- **Framer Motion** for premium interactions and animations.
- **Lucide React** for consistent, meaningful iconography.

### Mobile
- **React Native 0.84** with **React Native Web** for cross-platform rendering.
- **React Navigation** (Bottom Tabs) with a custom floating glassmorphic tab bar.
- **AsyncStorage** for persistent local data.
- **Lucide React Native** for iconography.
- **React Native Toast Message** with theme-aware custom styling.

### Shared
- **TMDB API** for a comprehensive global media database.

---

## 🚀 Getting Started

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
- **Node.js** ≥ 22.11.0
- **Java JDK 17** (required by React Native 0.84)
- **Android SDK** with Build Tools, Platform Tools, and SDK Platform 35
- Set `ANDROID_HOME` environment variable

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

*Keep archiving. Keep watching.* 🍿
