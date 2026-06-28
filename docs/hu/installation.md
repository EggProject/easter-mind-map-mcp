# Telepítés

🇬🇧 **[English version ->](../en/installation.md)**

## Követelmények

- Bun `>=1.3.0`
- pnpm elérhető a `PATH`-on az automatikus bundled upstream installhoz/indításhoz
- HTTP-n elérhető MindGeniusAI upstream szerver
- Stdio szervert indítani tudó MCP host

## Repo klónozása

Először hozz létre egy lokális checkoutot:

```bash
git clone https://github.com/EggProject/easter-mind-map-mcp.git
cd easter-mind-map-mcp
```

A repo commitolja a `dist/index.js` fájlt. Az MCP hostokat erre a fájlra
konfiguráld, ne a TypeScript forrásfájlra.

Meglévő checkout esetén az MCP host újraindítása előtt húzd le a legfrissebb
commitolt runtime artifactot:

```bash
git pull
```

## Fejlesztői függőségek

A repo függőségeit csak fejlesztéshez, tesztekhez vagy forrásmódosítás utáni
`dist/index.js` frissítéshez kell telepíteni:

```bash
bun install
```

Közvetlen protokoll smoke testhez futtasd a commitolt runtime artifactot:

```bash
bun dist/index.js
```

A `bun run build` csak saját fejlesztéskor kell, amikor forrásmódosítás után
frissíted a `dist/index.js` fájlt.

## MCP szerver közvetlen futtatása

```bash
bun dist/index.js
```

A folyamat MCP stdio szervert indít, és arra vár, hogy a host MCP protokollon
kommunikáljon vele. Ez nem interaktív shell parancs.

## MCP host konfiguráció

A repo gyökerét add meg working directoryként, hogy a relatív utak, például a
`data/` és a `documents/`, ezen a projekten belül oldódjanak fel.

```json
{
  "mcpServers": {
    "easter-mind-map": {
      "command": "bun",
      "args": ["dist/index.js"],
      "cwd": "/absolute/path/to/easter-mind-map-mcp",
      "env": {
        "EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL": "http://127.0.0.1:8787",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3",
        "EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS": "documents"
      }
    }
  }
}
```

Saját fejlesztés közben minden forrásmódosítás után futtasd újra a
`bun run build` parancsot, mielőtt újraindítod az MCP hostot.

A provider változóknak annak az MCP szerver processnek a környezetében kell
benne lenniük, amelyik a `bun dist/index.js` parancsot futtatja. A `~/.zshrc`
jellegű shell startup fájlok MCP hostoknál csak akkor megbízható források, ha
maga a host process is abból a shell sessionből indult. Megbízható beállításhoz
tedd a `EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER`, `EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY` és
kapcsolódó értékeket az MCP host `env` blokkjába, vagy indítsd az MCP hostot
olyan környezetből, ahol ezek már exportálva vannak.

Ha az upstream még nem fut, az adapter alapértelmezetten a
`pnpm --dir original-MindGeniusAI dev:server` paranccsal indítja az
`original-MindGeniusAI` szervert. Ha az `original-MindGeniusAI/node_modules`
hiányzik, előbb lefuttatja a `pnpm --dir original-MindGeniusAI install
--frozen-lockfile` parancsot. A `EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND` vagy
`EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND` változót csak akkor írd felül, ha más parancsot
akarsz. Az adapter minden upstream futás előtt ellenőrzi az `/api/health`
végpontot, és a beállított health timeoutig vár.

## Upstream alkalmazás

A repo tartalmazza az upstream szervert az `original-MindGeniusAI/`
könyvtárban. Ennek saját scriptjei `pnpm`-et használnak; az adapter szükség
esetén automatikusan telepíti a függőségeit.

```bash
cd original-MindGeniusAI
pnpm install
pnpm dev:server
```

Ezeket a parancsokat csak akkor használd, ha kézzel akarod futtatni az
upstreamet. A `EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL` arra a szerver URL-re mutasson, amely
kiszolgálja az `/api/health`, `/api/agent`, `/api/uploadFile` és
`/api/document/init` végpontokat.
