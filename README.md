# InnerWeather

A mood-tracking Android app built with **Capacitor 6 + Vanilla JavaScript**.
Log a daily mood score, weather, and notes. The app surfaces trends, insights, and AI-generated weekly/monthly summaries of your emotional patterns.

---

## Screenshots

<p align="center">
  <img src="Images/1.jpeg" width="200" />
  <img src="Images/2.jpeg" width="200" />
  <img src="Images/3.jpeg" width="200" />
  <img src="Images/4.jpeg" width="200" />
  <img src="Images/5.jpeg" width="200" />
  <img src="Images/6.jpeg" width="200" />
  <img src="Images/7.jpeg" width="200" />
  <img src="Images/8.jpeg" width="200" />
</p>

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Capacitor 6 (Android) |
| Bundler | Vite 5 |
| CSS | Tailwind CSS v4 + CSS custom properties |
| Charts | Chart.js |
| Animations | Custom Canvas 2D (leaf fall + snowfall) |
| Auth | Firebase Anonymous Auth |
| Storage | `@capacitor/preferences` |
| Notifications | `@capacitor/local-notifications` |
| AI Summaries | OpenAI GPT-4o-mini via Google Cloud Function |
| Ads | Google AdMob (custom Capacitor plugin) |

---

## Project Structure

```
innerweather-capacitor/
├── index.html
├── capacitor.config.json
├── vite.config.js
├── package.json
├── cloud-function/
│   └── main.py                     ← AI mood analysis Cloud Function
├── public/
│   └── icons/                      ← App icons
├── android/
│   └── app/src/main/java/.../
│       ├── MainActivity.java
│       ├── AdPlugin.java           ← AdMob Capacitor plugin
│       ├── AppCheckPlugin.java     ← Firebase App Check plugin
│       └── DownloadPlugin.java     ← Downloads folder export plugin
└── src/
    ├── css/
    │   ├── styles.css              ← Entry: @import chain only
    │   ├── variables.css           ← Design tokens (:root)
    │   ├── base.css
    │   ├── appbar.css
    │   ├── nav.css
    │   ├── cards.css
    │   ├── seasons.css
    │   ├── editor.css
    │   ├── day-view.css
    │   ├── charts.css
    │   ├── insights.css
    │   ├── settings.css
    │   ├── dark.css                ← All dark mode overrides
    │   └── responsive.css          ← All @media breakpoints
    └── js/
        ├── main.js                 ← App shell, init, streak, theme
        ├── router.js               ← SPA stack router + cleanup registry
        ├── store.js                ← DayData singleton + data models
        ├── icons.js                ← SVG icon paths
        ├── charts.js               ← All Chart.js render functions
        ├── firebase-auth.js        ← Anonymous sign-in
        ├── notifications.js        ← Daily reminder scheduling
        ├── ai-service.js           ← AI insight API calls
        ├── ad-manager.js           ← Ad integration
        ├── utils/
        │   ├── dom.js              ← el(), showToast(), iconBadge()
        │   ├── data.js             ← Data helpers + streak calculation
        │   └── download-helper.js  ← JSON file export (web + native)
        ├── components/
        │   ├── day-card.js
        │   ├── season-card.js      ← Canvas leaf/snow animations
        │   ├── modal.js
        │   └── ai-insight-button.js
        └── screens/
            ├── home.js
            ├── season.js
            ├── day-editor.js
            ├── day-view.js
            ├── insights.js
            ├── trends.js
            └── settings.js
```

## Build & Run

```bash
# Install dependencies
npm install

# Local dev server
npm run dev

# Production build
npm run build

# Sync web assets to Android
npm run cap:sync

# Open in Android Studio
npm run cap:android
```

---

## Android Permissions

The following permissions are declared in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
```

Post-notification and exact-alarm permissions are requested at runtime via `@capacitor/local-notifications`.

---

## Custom Capacitor Plugins

| Plugin | Java class | Purpose |
|---|---|---|
| `DownloadHelper` | `DownloadPlugin.java` | Save JSON backup to the public Downloads folder (MediaStore on Android 10+, direct file write on Android 9 and below) |
| `AdPlugin` | `AdPlugin.java` | AdMob banner and interstitial ads |
| `AppCheckPlugin` | `AppCheckPlugin.java` | Expose Firebase App Check tokens to JS |

All three are registered in `MainActivity.java` via `registerPlugin()`.
