# <Bővítmény neve>

> <Egysoros tagline, amely leírja, mit csinál a bővítmény, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Marketplace verzió](https://img.shields.io/visual-studio-marketplace/v/<publisher>.<name>?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)
[![Telepítések](https://img.shields.io/visual-studio-marketplace/i/<publisher>.<name>)](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)
[![Értékelés](https://img.shields.io/visual-studio-marketplace/r/<publisher>.<name>)](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

> Bemutató a(z) <bővítmény-név> működéséről.

![Demo GIF](docs/demo.gif)

## Mi ez?

**`<bővítmény-név>`** egy Visual Studio Code bővítmény, amely
`<X>-t csinál`. A `<versenytárs>`-tól eltérően `<megkülönböztető
tulajdonság>`.

## Telepítés

Telepítsd a VS Code Marketplace-ről:

[<img src="https://img.shields.io/badge/VS_Code-telep%C3%ADt%C3%A9s-blue?style=for-the-badge&logo=visual-studio-code" alt="Telepítés a VS Code Marketplace-ről">](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)

Vagy parancssorból:

```bash
code --install-extension <publisher>.<name>
```

## Konfiguráció

Add hozzá a `settings.json`-hoz:

```json
{
  "<name>.enable": true,
  "<name>.maxLineLength": 100,
  "<name>.formatOnSave": true
}
```

| Beállítás | Alapérték | Leírás |
|---|---|---|
| `<name>.enable` | `true` | Bővítmény engedélyezése. |
| `<name>.maxLineLength` | `100` | A formatter maximális sorhossza. |
| `<name>.formatOnSave` | `true` | Formatter futtatása mentéskor. |

## Parancsok

| Parancs | Leírás |
|---|---|
| `extension.doSomething` | A fő művelet futtatása az aktív fájlon. |
| `extension.format` | A formatter futtatása az aktív fájlon. |
| `extension.toggle` | A bővítmény be/ki kapcsolása. |

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
