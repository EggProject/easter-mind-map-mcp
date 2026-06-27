# Telepítés

🇬🇧 **[English version ->](../en/installation.md)**

## Követelmények

- Bun `>=1.3.0`
- HTTP-n elérhető MindGeniusAI upstream szerver
- Stdio szervert indítani tudó MCP host

## Függőségek telepítése

```bash
bun install
```

Futtasd a szervert közvetlenül a commitolt runtime artifactból:

```bash
bun dist/index.js
```

A repo commitolja a `dist/index.js` fájlt. Az MCP hostokat erre a fájlra
konfiguráld, ne a TypeScript forrásfájlra. A `bun run build` csak saját
fejlesztéskor kell, amikor forrásmódosítás után frissíted a `dist/index.js`
fájlt.

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
        "MINDGENIUS_BASE_URL": "http://127.0.0.1:8787",
        "MINDMAP_DATA_DIR": "data",
        "MINDMAP_DOCUMENT_ROOTS": "documents"
      }
    }
  }
}
```

Saját fejlesztés közben minden forrásmódosítás után futtasd újra a
`bun run build` parancsot, mielőtt újraindítod az MCP hostot.

Ha az upstream még nem fut, állítsd be a `MINDGENIUS_START_COMMAND` változót
arra a parancsra, amely elindítja. Az adapter minden upstream futás előtt
ellenőrzi az `/api/health` végpontot, és a beállított health timeoutig vár.

## Upstream alkalmazás

A repo tartalmaz egy upstream snapshotot az `original-MindGeniusAI/`
könyvtárban. Ennek saját scriptjei `pnpm`-et használnak; ezt az alkalmazást az
adaptertől külön kell konfigurálni.

```bash
cd original-MindGeniusAI
pnpm install
pnpm dev:server
```

A `MINDGENIUS_BASE_URL` arra a szerver URL-re mutasson, amely kiszolgálja az
`/api/health`, `/api/agent`, `/api/uploadFile` és `/api/document/init`
végpontokat.
