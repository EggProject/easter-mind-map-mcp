# <Projekt neve>

> <Egysoros tagline, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![App Store](https://img.shields.io/badge/App_Store-let%C3%B6lt%C3%A9s-blue?logo=apple)](https://apps.apple.com/app/<id>)
[![Google Play](https://img.shields.io/badge/Google_Play-let%C3%B6lt%C3%A9s-green?logo=google-play)](https://play.google.com/store/apps/details?id=<id>)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

| 1. képernyő | 2. képernyő | 3. képernyő |
|---|---|---|
| ![1. képernyő](docs/screen-1.png) | ![2. képernyő](docs/screen-2.png) | ![3. képernyő](docs/screen-3.png) |

## Mi ez?

**`<app-név>`** egy iOS és Android mobilalkalmazás, amely
`<X>-t csinál`. A `<versenytárs>`-tól eltérően `<megkülönböztető
tulajdonság>`.

## Telepítés

Telepítsd az alkalmazásboltból:

- 📱 **iOS:** [App Store](https://apps.apple.com/app/<id>)
- 🤖 **Android:** [Google Play](https://play.google.com/store/apps/details?id=<id>)

## Build forrásból

### iOS

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
open ios/<app-név>.xcworkspace
# Build: Cmd+R az Xcode-ban
```

### Android

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/
```

A teljes toolchain beállítást lásd [docs/build.md](docs/build.md)-ben.

## Architektúra

- **UI keretrendszer:** <pl. React Native 0.74 / Flutter 3.x / SwiftUI>
- **State management:** <pl. Redux / Riverpod / Bloc>
- **Helyi tárolás:** <pl. SQLite via Realm / Hive / Core Data>
- **Hálózat:** <pl. Axios / Dio / URLSession>

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
