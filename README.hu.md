# easter-mind-map-mcp

> Memória alapú MCP adapter MindGeniusAI mind map generáláshoz, finomításhoz, erőforrásokhoz és exportokhoz.

[![Verzió](https://img.shields.io/badge/verzi%C3%B3-0.1.0-blue.svg)](package.json)
[![Runtime](https://img.shields.io/badge/runtime-Bun%20%3E%3D1.3.0-black.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](tsconfig.json)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version ->](README.md)**

---

## Mi ez?

Az **`easter-mind-map-mcp`** egy Bun és TypeScript alapú MCP szerver, amely a
MindGeniusAI upstream alkalmazást hostbarát eszközök mögé teszi. A tervállapotot
az aktuális MCP process memóriájában tartja, sorba rendezi a futásokat, a process
élettartamán belül stabil ID-kat őriz meg, MCP erőforrásokat ad a tervadatokhoz,
és a kész mapeket lazy resource read során exportálja OPML, PNG vagy Markdown
formátumba.

A szerver stdio-n keresztül beszél MCP-t. Saját HTTP API-t nem nyit; egy
környezeti változókkal beállított MindGeniusAI HTTP/SSE upstreamet hív.

## Gyors kezdés

Telepítsd mindkét runtime eszközt, mielőtt MCP hostba kötöd a szervert:

- Bun `>=1.3.0` futtatja ezt az adaptert és a `dist/index.js` entrypointot.
- A pnpm legyen elérhető a `PATH`-on, mert a bundled `original-MindGeniusAI`
  upstream ezt használja az automatikus installhoz/indításhoz.

A repo checkoutban frissítsd a commitolt runtime artifactot, majd telepítsd a
függőségeket:

```bash
git pull
bun install
bun dist/index.js
```

A commitolt `dist/index.js` az MCP hostok runtime entrypointja. Fordítani csak
akkor kell, ha saját fejlesztés közben TypeScript forrásfájlokat módosítasz.
Ha az upstream még nem healthy, az adapter automatikusan elindítja a bundled
`original-MindGeniusAI` szervert a `pnpm --dir original-MindGeniusAI dev:server`
paranccsal.
A MindGeniusAI provider változókat, például `EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER` és
`EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY`, az MCP host env-jében add meg.
A változóknak a `bun dist/index.js` process indulásakor kell látszaniuk. A
`~/.zshrc` jellegű shell startup fájlok csak akkor elegendők, ha maga az MCP
host is abból a shell sessionből indult; különben tedd a változókat az MCP host
`env` blokkjába.
Lásd az [MCP host bekötést](docs/hu/installation.md) és a
[környezeti változók listáját](docs/hu/configuration.md) a teljes beállítási
blokkhoz.
A logolás alapból ki van kapcsolva `EASTER_MIND_MAP_MCP_LOGLEVEL=NONE`
értékkel; `EASTER_MIND_MAP_MCP_LOGLEVEL=DEBUG` esetén részletes adapter és
MindGeniusAI szerverkimenet íródik alapértelmezetten ide:
`/tmp/easter-mind-map-mcp/logs/mcp.log`.

Az MCP host bekötéséhez, az upstream beállításához és a kötelező tool flow-hoz
használd az alább szétbontott dokumentációt, ne ezt az egy fájlt.

## Dokumentáció

- 📖 **[Dokumentációs index](docs/README.hu.md)**
- 📦 **[Telepítés](docs/hu/installation.md)**
- ⚙️ **[Konfiguráció](docs/hu/configuration.md)**
- ▶️ **[Használat](docs/hu/usage.md)**
- 🧰 **[Tool referencia](docs/hu/tool-reference.md)**
- 🏗️ **[Architektúra](docs/hu/architecture.md)**

Meglévő mérnöki jegyzetek:

- 🧭 **[MCP tool szerződés](docs/MCP-TOOLS.md)**
- 🔌 **[MindGeniusAI upstream szerződés](docs/UPSTREAM-CONTRACT.md)**
- 🧱 **[Architektúradöntések](docs/ADR/)**

## Projektstruktúra

```text
src/                    MCP szerver, service rétegek, tárolás, export, upstream kliens
dist/                   Commitolt MCP runtime entrypoint host konfigurációhoz
test/                   Bun tesztek service viselkedésre és MCP stdio integrációra
docs/                   Felhasználói dokumentáció, szerződések, ADR-ek, tervezési jegyzetek
original-MindGeniusAI/  Upstream MindGeniusAI alkalmazas snapshot
```

## Scriptek

| Parancs                | Cél                                                             |
| ---------------------- | --------------------------------------------------------------- |
| `bun test`             | Bun tesztcsomag futtatása.                                      |
| `bun run build`        | Csak fejlesztéshez: type-check és a `dist/index.js` frissítése. |
| `bun run lint`         | ESLint futtatása.                                               |
| `bun run format:check` | Prettier formátumellenőrzés.                                    |
| `bun run format`       | Illeszkedő fájlok formázása Prettierrel.                        |

## Licenc

Ebben az adapter repóban nincs root `LICENSE` fájl deklarálva.
