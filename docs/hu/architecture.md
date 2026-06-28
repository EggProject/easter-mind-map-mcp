# Architektúra

🇬🇧 **[English version ->](../en/architecture.md)**

Az `easter-mind-map-mcp` állapottartó adapter egy MCP host és a MindGeniusAI
upstream service kozott.

## Komponensek

| Komponens               | Fajlok                                          | Felelosseg                                                                                    |
| ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| MCP határ               | `src/index.ts`, `src/mcp/server.ts`             | Stdio szerver indítása, toolok regisztrálása, erőforrások exponálása.                         |
| Service réteg           | `src/service.ts`                                | Tervek, futások, dokumentumok, megszakítás, idempotencia és exportok kezelése.                |
| Queue                   | `src/queue.ts`                                  | Globális, ownerenkénti és tervenkénti párhuzamossági limitek betartása.                       |
| Store                   | `src/store.ts`                                  | Tervek, futások, események, dokumentumok és idempotencia rekordok process memóriában tartása. |
| Upstream kliens         | `src/upstream/client.ts`, `src/upstream/sse.ts` | MindGeniusAI HTTP végpontok hívása és SSE agent eventek dekódolása.                           |
| Reducer és export       | `src/mindmap.ts`, `src/export.ts`               | Upstream eventek commitolt mappé alakítása és export formátumok renderelése.                  |
| Biztonsági ellenőrzések | `src/security.ts`                               | Owner izoláció és dokumentum root korlátozások betartatása.                                   |

## Adatfolyam

```text
MCP host
  -> stdio MCP szerver
  -> MindMapService
  -> RunQueue
  -> MindGeniusAI HTTP/SSE upstream
  -> event reducer
  -> MemoryStore
  -> MCP erőforrások és export linkek
```

## Runtime állapotmodell

Az upstream a `/api/agent` kérések között többnyire állapotmentes marad. Ez az
adapter process memóriában kezeli a `planningId`, `runId`, `documentId`, esemény
history, commitolt map verziók, megszakítási állapot és idempotencia kulcsok
állapotát.

Az MCP szerver újraindítása törli a memóriában tartott planeket, futásokat,
idempotencia kulcsokat, dokumentum metadatát és export snapshotokat. Pending
futás restart után nem áll vissza.

A `mindmap_export` verziózott resource linkeket ad vissza, például
`mindmap://exports/{planningId}/{version}/png`. Az adapter nem tárol PNG, OPML
vagy Markdown export payloadot. Amikor a host olvassa az export resource-t, az
MCP szerver akkor hívja meg a MindGeniusAI `/api/export` végpontját az adott
verzió snapshotjával, és azonnal továbbadja a választ MCP resource response-ként.

## Határok

Az adapter nem tárol LLM provider titkokat. A provider konfiguráció a
MindGeniusAI upstreamhez tartozik. Az adapter csak az MCP callerekhez szükséges
aktuális workflow állapotot tartja memóriában.

Az upstream HTTP/SSE szerződést lásd itt: [UPSTREAM-CONTRACT.md](../UPSTREAM-CONTRACT.md).
