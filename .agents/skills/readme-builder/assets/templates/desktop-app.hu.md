# <Projekt neve>

> <Egysoros tagline, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)](#)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

| Fő nézet | Beállítások | Munkafolyamat |
|---|---|---|
| ![Fő nézet](docs/screenshot-1.png) | ![Beállítások](docs/screenshot-2.png) | ![Munkafolyamat](docs/screenshot-3.png) |

## Mi ez?

**`<app-név>`** egy asztali alkalmazás `<platform>`-ra, amely
`<X>-t csinál`. A `<versenytárs>`-tól eltérően `<megkülönböztető
tulajdonság>`.

## Telepítés

- **macOS:** töltsd le a(z) `<app-név>-<verzió>.dmg` fájlt a
  [Releases](https://github.com/<owner>/<repo>/releases/latest)
  oldalról
- **Windows:** töltsd le a(z) `<app-név>-<verzió>.exe` fájlt a
  [Releases](https://github.com/<owner>/<repo>/releases/latest)
  oldalról
- **Linux:** töltsd le a(z) `<app-név>-<verzió>.AppImage` fájlt a
  [Releases](https://github.com/<owner>/<repo>/releases/latest)
  oldalról

Vagy csomagkezelőn keresztül:

```bash
brew install --cask <app-név>      # macOS / Homebrew
scoop install <app-név>             # Windows / Scoop
flatpak install <app-név>           # Linux / Flathub
```

## Használat

| Billentyűkombináció | Művelet |
|---|---|
| `Cmd/Ctrl + N` | Új projekt |
| `Cmd/Ctrl + O` | Projekt megnyitása |
| `Cmd/Ctrl + S` | Projekt mentése |
| `Cmd/Ctrl + ,` | Beállítások megnyitása |

A teljes listát lásd [docs/shortcuts.md](docs/shortcuts.md)-ben.

## Build forrásból

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
npm install
npm run build
npm run dist
```

Az elkészült telepítők a `dist/` mappába kerülnek.

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
