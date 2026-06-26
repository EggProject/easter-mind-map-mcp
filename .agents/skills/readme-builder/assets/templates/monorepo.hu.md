# <Monorepo neve>

> <Egysoros tagline a package-gyűjteményről, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

## Mi ez?

A(z) `<monorepo-név>` egy gyűjtemény, amely `<N>` package-ből áll,
és együtt biztosítja a(z) `<X>`-et. Ez egy monorepo, amelyet
`<pnpm / lerna / NX / Turborepo / Bazel>` kezel.

## Packagek

| Package | Leírás | Verzió |
|---|---|---|
| [`@scope/core`](packages/core) | Alap könyvtár. | ![npm](https://img.shields.io/npm/v/@scope/core) |
| [`@scope/cli`](packages/cli) | Parancssori interfész. | ![npm](https://img.shields.io/npm/v/@scope/cli) |
| [`@scope/web`](packages/web) | Webes felület. | ![npm](https://img.shields.io/npm/v/@scope/web) |
| [`@scope/api`](packages/api) | HTTP API szerver. | ![npm](https://img.shields.io/npm/v/@scope/api) |
| [`@scope/shared`](packages/shared) | Megosztott típusok és utility-k. | ![npm](https://img.shields.io/npm/v/@scope/shared) |

Minden package saját README-vel rendelkezik. Kezdd a(z)
[`@scope/core`](packages/core)-ral — a legtöbb más package tőle
függ.

## Gyors indulás

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
pnpm install              # vagy `npm install` / `yarn`
pnpm build                # minden package buildelése
pnpm test                 # minden package tesztelése
```

Egy package-en való munkához:

```bash
pnpm --filter @scope/cli dev     # a CLI futtatása dev módban
pnpm --filter @scope/web build   # csak a web UI buildelése
```

## Architektúra

```
┌──────────┐     ┌──────────┐
│  @scope/ │────▶│  @scope/ │
│   web    │     │   core   │
└──────────┘     └──────────┘
      │                ▲
      ▼                │
┌──────────┐     ┌──────────┐
│  @scope/ │────▶│  @scope/ │
│   api    │     │  shared  │
└──────────┘     └──────────┘
```

- A `@scope/core` a függőségi hub — a legtöbb más package tőle
  függ.
- A `@scope/shared` olyan típusokat és utility-ket tartalmaz,
  amelyek nem illenek a `core`-ba.
- A `@scope/web` és `@scope/api` a két deployolható felület.

A teljes tervezési dokumentációt lásd
[docs/architecture.md](docs/architecture.md)-ben.

## Közreműködés

A PR-okat szívesen fogadjuk. Az új packagek a `packages/` mappába
kerülnek. A monorepo munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
