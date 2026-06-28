# <Project Name>

> <One-line tagline, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)](#)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

| Main view | Settings | Workflow |
|---|---|---|
| ![Main](docs/screenshot-1.png) | ![Settings](docs/screenshot-2.png) | ![Workflow](docs/screenshot-3.png) |

## What is this?

**`<app-name>`** is a desktop app for `<platform>` that does
`<X>`. Unlike `<competitor>`, it `<differentiator>`.

## Installation

- **macOS:** download `<app-name>-<version>.dmg` from
  [Releases](https://github.com/<owner>/<repo>/releases/latest)
- **Windows:** download `<app-name>-<version>.exe` from
  [Releases](https://github.com/<owner>/<repo>/releases/latest)
- **Linux:** download `<app-name>-<version>.AppImage` from
  [Releases](https://github.com/<owner>/<repo>/releases/latest)

Or via package manager:

```bash
brew install --cask <app-name>      # macOS / Homebrew
scoop install <app-name>             # Windows / Scoop
flatpak install <app-name>           # Linux / Flathub
```

## Usage

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + N` | New project |
| `Cmd/Ctrl + O` | Open project |
| `Cmd/Ctrl + S` | Save project |
| `Cmd/Ctrl + ,` | Open settings |

See [docs/shortcuts.md](docs/shortcuts.md) for the full list.

## Build from source

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
npm install
npm run build
npm run dist
```

The built installers land in `dist/`.

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
