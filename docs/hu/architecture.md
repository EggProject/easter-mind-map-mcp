# Architektúra

🇬🇧 **[English version ->](../en/architecture.md)**

Az `easter-mind-map-mcp` állapottartó adapter egy MCP host és a MindGeniusAI
upstream service kozott.

## Komponensek

| Komponens               | Fajlok                                          | Felelosseg                                                                                  |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| MCP határ               | `src/index.ts`, `src/mcp/server.ts`             | Stdio szerver indítása, toolok regisztrálása, erőforrások exponálása.                       |
| Service réteg           | `src/service.ts`                                | Tervek, futások, dokumentumok, megszakítás, idempotencia és exportok kezelése.              |
| Queue                   | `src/queue.ts`                                  | Globális, ownerenkénti és tervenkénti párhuzamossági limitek betartása.                     |
| Store                   | `src/store.ts`                                  | Tervek, futások, események, dokumentumok és artifactok tárolása a `MINDMAP_DATA_DIR` alatt. |
| Upstream kliens         | `src/upstream/client.ts`, `src/upstream/sse.ts` | MindGeniusAI HTTP végpontok hívása és SSE agent eventek dekódolása.                         |
| Reducer és export       | `src/mindmap.ts`, `src/export.ts`               | Upstream eventek commitolt mappé alakítása és export formátumok renderelése.                |
| Biztonsági ellenőrzések | `src/security.ts`                               | Owner izoláció és dokumentum root korlátozások betartatása.                                 |

## Adatfolyam

```text
MCP host
  -> stdio MCP szerver
  -> MindMapService
  -> RunQueue
  -> MindGeniusAI HTTP/SSE upstream
  -> event reducer
  -> FileStore
  -> MCP erőforrások és export linkek
```

## Perzisztencia modell

Az upstream a `/api/agent` kérések között többnyire állapotmentes marad. Ez az
adapter birtokolja a tartós `planningId`, `runId`, `documentId`, esemény
history, commitolt map verziók, megszakítási állapot és idempotencia kulcsok
kezelését.

Indításkor a pending futások visszaállnak. Ha egy futás `queued` vagy `running`
állapotban volt a folyamat leállásakor, újra sorba kerül, így a host ugyanazzal
a `planningId` értékkel folytathatja a pollingot.

## Határok

Az adapter nem tárol LLM provider titkokat. A provider konfiguráció a
MindGeniusAI upstreamhez tartozik. Az adapter csak az MCP callerekhez szükséges
workflow állapotot és artifact adatokat tárolja.

Az upstream HTTP/SSE szerződést lásd itt: [UPSTREAM-CONTRACT.md](../UPSTREAM-CONTRACT.md).
