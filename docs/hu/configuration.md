# Konfiguráció

🇬🇧 **[English version ->](../en/configuration.md)**

A szerver indításkor környezeti változókból olvassa a konfigurációt. A relatív
utak a `dist/index.js` alapján felismert repo gyökeréből oldódnak fel.

## Környezeti változók

| Változó                                            | Alapérték                                                    | Cél                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL`          | `http://127.0.0.1:8787`                                      | A MindGeniusAI upstream HTTP szerver base URL-je.                                          |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND`     | `pnpm --dir original-MindGeniusAI dev:server`                | Parancs az upstream indítására, ha a health check sikertelen.                              |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND`   | `pnpm --dir original-MindGeniusAI install --frozen-lockfile` | Egyszer futó parancs, ha a bundled upstream dependency-k hiányoznak.                       |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_HEALTH_TIMEOUT_MS` | `30000`                                                      | Maximális várakozási idő az upstream health checkre indítás után.                          |
| `EASTER_MIND_MAP_MCP_LOGLEVEL`                     | `NONE`                                                       | Fájllogolási szint: `NONE`, `ERROR`, `WARN`, `INFO` vagy `DEBUG`.                          |
| `EASTER_MIND_MAP_MCP_LOGPATH`                      | `/tmp/easter-mind-map-mcp/logs/mcp.log`                      | Logfájl útvonala.                                                                          |
| `EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR`             | `/tmp/easter-mind-map-mcp/data`                              | Fenntartott runtime adatkönyvtár. A plan, run és export artifact állapot memóriában marad. |
| `EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS`       | `/tmp/easter-mind-map-mcp/documents`                         | Vesszővel elválasztott könyvtárlista, ahonnan lokális PDF dokumentum feltölthető.          |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_RUNS_GLOBAL`      | `4`                                                          | Globális párhuzamos generálási limit.                                                      |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_RUNS_PER_OWNER`   | `2`                                                          | Ownerenkénti párhuzamos generálási limit.                                                  |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_DOCUMENT_INDEXES` | `2`                                                          | Párhuzamos dokumentumindexelési limit.                                                     |
| `EASTER_MIND_MAP_MCP_MINDMAP_UPSTREAM_TIMEOUT_MS`  | `180000`                                                     | Egy upstream SSE keres timeoutja.                                                          |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_RETRIES`          | `1`                                                          | Sikertelen sorba tett futások újrapróbálási száma.                                         |

## Runtime könyvtárak

A plan, run, idempotency, dokumentum metadata és export snapshot állapot az MCP
process élettartamára memóriában marad. Az MCP szerver újraindítása ezt az
állapotot törli. Az `EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR` fenntartott runtime
adatkönyvtár, de az alapértelmezett implementáció nem ír `state.json` fájlt.

A `EASTER_MIND_MAP_MCP_LOGPATH` alapértéke
`/tmp/easter-mind-map-mcp/logs/mcp.log`. A logolás alapból ki van kapcsolva
`EASTER_MIND_MAP_MCP_LOGLEVEL=NONE` értékkel. Használj
`EASTER_MIND_MAP_MCP_LOGLEVEL=DEBUG` beállítást, ha részletes MCP adapter
eseményeket és a bundled MindGeniusAI szerver stdout/stderr kimenetét is látni
akarod.

A `EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS` korlátozza, hogy a `mindmap_document_add` mely
lokális PDF-eket töltheti fel. Az ezeken kívüli utak már az upstream hívása
előtt elutasításra kerülnek.

## Upstream indítás

Alapértelmezetten az adapter a bundled `original-MindGeniusAI` szervert indítja
el az első sikertelen health check után, szerverfolyamatonként csak egyszer. A
parancs whitespace mentén darabolódik, és Bun process runnerrel indul.

Indítás előtt az adapter ellenőrzi az `original-MindGeniusAI/node_modules`
könyvtárat. Ha hiányzik, előbb lefuttatja a `EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND`
parancsot, így egy friss checkout kézi upstream könyvtárkezelés nélkül is
elindulhat.

Összetett indítási parancshoz használj inkább egy kis wrapper scriptet, és a
`EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND` arra a scriptre mutasson.

## MindGeniusAI környezet

Az upstream process az alap rendszerkörnyezetet, például a `PATH` értéket,
valamint a kifejezetten `EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_` prefixszel
megadott MindGeniusAI változókat kapja meg. Az adapter levágja ezt a prefixet,
tehát az `EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY` upstream oldalon
`MINIMAX_API_KEY` lesz.

Az MCP szerver csak azokat a változókat tudja továbbadni, amelyek a
`bun dist/index.js` indulásakor látszanak a saját `process.env` értékében. A
`~/.zshrc` jellegű shell startup fájlok nem érvényesek automatikusan minden MCP
host processre. Ha shell fájlra támaszkodsz, az MCP hostot abból a shell
sessionből indítsd; különben a provider változókat az MCP host `env` blokkjába
tedd.

Provider beállításokhoz ezt a prefixet használd:

```json
{
  "env": {
    "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
    "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
    "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3"
  }
}
```

`EASTER_MIND_MAP_MCP_LOGLEVEL=DEBUG` mellett az indítási log tartalmazza azokat az env kulcsokat,
amelyeket az adapter továbbad a MindGeniusAI-nak. A titoknak tűnő értékek
redaktálva jelennek meg, tehát egy jelen lévő API kulcs `<redacted>` értékkel
látszik, nem nyersen. Ha egy kulcs nem szerepel ott, akkor az MCP szerver process
nem kapta meg.

Ha a `EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL` nincs beállítva, az
`EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_PORT` módosítja a default health-check URL-t.
Egyébként az adapter `PORT=8787` értéket ad a bundled upstreamnek, hogy az
alapértelmezett health check és az indított szerver ugyanarra a portra kerüljön.
