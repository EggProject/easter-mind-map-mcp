# <Projekt neve>

> <Egysoros tagline, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

## Mi ez?

**`<cli-név>`** egy parancssori eszköz, amely `<X>-t csinál` `<Y>`
számára. A `<versenytárs>`-tól eltérően `<megkülönböztető
tulajdonság>`.

## Bemutató

```
$ <cli-név> init
✓ Inicializálva: <dolog> az aktuális könyvtárban

$ <cli-név> build
✓ 3 asset buildelve 1.2s alatt
```

## Telepítés

```bash
# Válaszd ki a nyelvnek megfelelő telepítési parancsot:
brew install <cli-név>          # macOS / Linux (Homebrew)
npm install -g <cli-név>        # Node / npm
cargo install <cli-név>         # Rust / cargo
pipx install <cli-név>          # Python
scoop install <cli-név>         # Windows (Scoop)
```

## Használat

| Parancs | Leírás |
|---|---|
| `<cli-név> init` | Új projekt inicializálása az aktuális könyvtárban. |
| `<cli-név> build` | Production build készítése. |
| `<cli-név> test` | Tesztcsomag futtatása. |
| `<cli-név> deploy` | Deployment a konfigurált célra. |
| `<cli-név> --help` | Teljes parancs-referencia megjelenítése. |

A teljes parancslistát és kapcsolókat lásd
[docs/commands.md](docs/commands.md)-ben.

## Konfiguráció

| Beállítás | Alapérték | Leírás |
|---|---|---|
| `<CLI_NAME>_CONFIG` env var | `~/.config/<cli-név>/config.yml` | A konfigurációs fájl útvonala. |
| `<CLI_NAME>_LOG_LEVEL` | `info` | Log szint: `debug`, `info`, `warn`, `error`. |

## Közreműködés

A PR-okat szívesen fogadjuk. Nem triviális változtatásokhoz előbb
nyiss egy issue-t. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
