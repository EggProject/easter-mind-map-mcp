# <Project Name>

> <One-line tagline, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![App Store](https://img.shields.io/badge/App_Store-Download-blue?logo=apple)](https://apps.apple.com/app/<id>)
[![Google Play](https://img.shields.io/badge/Google_Play-Download-green?logo=google-play)](https://play.google.com/store/apps/details?id=<id>)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

| Screen 1 | Screen 2 | Screen 3 |
|---|---|---|
| ![Screen 1](docs/screen-1.png) | ![Screen 2](docs/screen-2.png) | ![Screen 3](docs/screen-3.png) |

## What is this?

**`<app-name>`** is a mobile app for iOS and Android that does
`<X>`. Unlike `<competitor>`, it `<differentiator>`.

## Installation

Install from the app store:

- 📱 **iOS:** [App Store](https://apps.apple.com/app/<id>)
- 🤖 **Android:** [Google Play](https://play.google.com/store/apps/details?id=<id>)

## Build from source

### iOS

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
open ios/<app-name>.xcworkspace
# Build with Cmd+R in Xcode
```

### Android

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/
```

See [docs/build.md](docs/build.md) for the full toolchain setup.

## Architecture

- **UI framework:** <e.g. React Native 0.74 / Flutter 3.x / SwiftUI>
- **State management:** <e.g. Redux / Riverpod / Bloc>
- **Local storage:** <e.g. SQLite via Realm / Hive / Core Data>
- **Networking:** <e.g. Axios / Dio / URLSession>

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
