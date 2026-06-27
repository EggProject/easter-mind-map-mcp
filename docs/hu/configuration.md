# Konfiguráció

🇬🇧 **[English version ->](../en/configuration.md)**

A szerver indításkor környezeti változókból olvassa a konfigurációt. A relatív
utak a folyamat working directoryjából oldódnak fel.

## Környezeti változók

| Változó                        | Alapérték                                                    | Cél                                                                                                             |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `MINDGENIUS_BASE_URL`          | `http://127.0.0.1:8787`                                      | A MindGeniusAI upstream HTTP szerver base URL-je.                                                               |
| `MINDGENIUS_START_COMMAND`     | `pnpm --dir original-MindGeniusAI dev:server`                | Parancs az upstream indítására, ha a health check sikertelen.                                                   |
| `MINDGENIUS_INSTALL_COMMAND`   | `pnpm --dir original-MindGeniusAI install --frozen-lockfile` | Egyszer futó parancs, ha a bundled upstream dependency-k hiányoznak.                                            |
| `MINDGENIUS_HEALTH_TIMEOUT_MS` | `30000`                                                      | Maximális várakozási idő az upstream health checkre indítás után.                                               |
| `LOGLEVEL`                     | `NONE`                                                       | Fájllogolási szint: `NONE`, `ERROR`, `WARN`, `INFO` vagy `DEBUG`.                                               |
| `LOGPATH`                      | `logs/easter-mind-map-mcp.log`                               | Logfájl neve vagy útvonala. Az adapter a projekt `logs/` könyvtárán belül tartja.                               |
| `MINDMAP_DATA_DIR`             | `data`                                                       | Lokális perzisztencia könyvtár tervekhez, futásokhoz, dokumentumokhoz, exportokhoz és idempotencia rekordokhoz. |
| `MINDMAP_DOCUMENT_ROOTS`       | `documents`                                                  | Vesszővel elválasztott könyvtárlista, ahonnan lokális PDF dokumentum feltölthető.                               |
| `MINDMAP_MAX_RUNS_GLOBAL`      | `4`                                                          | Globális párhuzamos generálási limit.                                                                           |
| `MINDMAP_MAX_RUNS_PER_OWNER`   | `2`                                                          | Ownerenkénti párhuzamos generálási limit.                                                                       |
| `MINDMAP_MAX_DOCUMENT_INDEXES` | `2`                                                          | Párhuzamos dokumentumindexelési limit.                                                                          |
| `MINDMAP_UPSTREAM_TIMEOUT_MS`  | `180000`                                                     | Egy upstream SSE keres timeoutja.                                                                               |
| `MINDMAP_MAX_RETRIES`          | `1`                                                          | Sikertelen sorba tett futások újrapróbálási száma.                                                              |

## Runtime könyvtárak

A `MINDMAP_DATA_DIR` az adapter saját állapotát tárolja. A szerver folyamat
számára írhatónak kell lennie, és ne használd forrásfájlokhoz.

A `LOGPATH` a projekt `logs/` könyvtára alá ír, amit a git ignorál. A logolás
alapból ki van kapcsolva `LOGLEVEL=NONE` értékkel. Használj `LOGLEVEL=DEBUG`
beállítást, ha részletes MCP adapter eseményeket és a bundled MindGeniusAI
szerver stdout/stderr kimenetét is látni akarod.

A `MINDMAP_DOCUMENT_ROOTS` korlátozza, hogy a `mindmap_document_add` mely
lokális PDF-eket töltheti fel. Az ezeken kívüli utak már az upstream hívása
előtt elutasításra kerülnek.

## Upstream indítás

Alapértelmezetten az adapter a bundled `original-MindGeniusAI` szervert indítja
el az első sikertelen health check után, szerverfolyamatonként csak egyszer. A
parancs whitespace mentén darabolódik, és Bun process runnerrel indul.

Indítás előtt az adapter ellenőrzi az `original-MindGeniusAI/node_modules`
könyvtárat. Ha hiányzik, előbb lefuttatja a `MINDGENIUS_INSTALL_COMMAND`
parancsot, így egy friss checkout kézi upstream könyvtárkezelés nélkül is
elindulhat.

Összetett indítási parancshoz használj inkább egy kis wrapper scriptet, és a
`MINDGENIUS_START_COMMAND` arra a scriptre mutasson.

## MindGeniusAI környezet

Az upstream process megkapja az MCP szerver környezetét. A MindGeniusAI
változókat közvetlenül az MCP host config `env` mezőjében is megadhatod, például
`LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `MINIMAX_API_KEY`,
`MINIMAX_MODEL`, `EMBEDDING_API_KEY`, `DISABLE_UPLOAD` és `MAX_UPLOAD_MB`.

Ütközések elkerülésére használható a `MINDGENIUS_ENV_` prefix is. Az adapter ezt
levágja, mielőtt elindítja az upstreamet:

```json
{
  "env": {
    "MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
    "MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
    "MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3"
  }
}
```

Ha a `MINDGENIUS_BASE_URL` nincs beállítva, a `MINDGENIUS_ENV_PORT` vagy `PORT`
a default health-check URL-t is módosítja. Egyébként az adapter `PORT=8787`
értéket ad a bundled upstreamnek, hogy az alapértelmezett health check és az
indított szerver ugyanarra a portra kerüljön.
