# <Action neve>

> <Egysoros tagline, amely leírja, mit csinál az action, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Marketplace](https://img.shields.io/badge/Marketplace-telep%C3%ADt%C3%A9s-blue?logo=github-actions)](https://github.com/marketplace/actions/<slug>)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

## Mi ez?

**`<action-név>`** egy újrafelhasználható GitHub Action, amely
`<X>-t csinál` `<Y>` számára. Használd bármely workflow-ban
`<megkülönböztető tulajdonság>`-hoz.

## Használat

```yaml
- uses: <owner>/<action-név>@v1
  with:
    input1: 'érték'
    input2: 'alapértelmezett-érték'
- run: echo "Action lefutott"
```

Egy teljes példa workflow:

```yaml
name: CI
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: <owner>/<action-név>@v1
        with:
          input1: 'érték'
      - run: echo "Kész"
```

## Bemenetek

| Bemenet | Kötelező | Alapérték | Leírás |
|---|---|---|---|
| `input1` | Igen | — | A bemeneti fájl útvonala. |
| `input2` | Nem | `'alapértelmezett-érték'` | Kapcsoló: `true` engedélyezi X-et, `false` kihagyja. |
| `github-token` | Nem | `${{ github.token }}` | A GitHub API hívásokhoz használt token. |

## Kimenetek

| Kimenet | Leírás |
|---|---|
| `result` | Az action fő eredménye (string). |
| `count` | A feldolgozott elemek száma (integer). |

## Build forrásból

```bash
git clone https://github.com/<owner>/<action-név>.git
cd <action-név>
npm install
npm run build
npm run package
```

A csomagolt action a `dist/` mappába kerül.

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
