# Architecture

🇭🇺 **[Magyar verzio ->](../hu/architecture.md)**

`easter-mind-map-mcp` is a stateful adapter between an MCP host and the
MindGeniusAI upstream service.

## Components

| Component           | Files                                           | Responsibility                                                                  |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| MCP boundary        | `src/index.ts`, `src/mcp/server.ts`             | Start the stdio server, register tools, and expose resources.                   |
| Service layer       | `src/service.ts`                                | Own plans, runs, documents, cancellation, idempotency, and exports.             |
| Queue               | `src/queue.ts`                                  | Enforce global, per-owner, and per-plan concurrency limits.                     |
| Store               | `src/store.ts`                                  | Persist plans, runs, events, documents, and artifacts under `MINDMAP_DATA_DIR`. |
| Upstream client     | `src/upstream/client.ts`, `src/upstream/sse.ts` | Call MindGeniusAI HTTP endpoints and decode SSE agent events.                   |
| Reducer and exports | `src/mindmap.ts`, `src/export.ts`               | Reduce upstream events into a committed map and render export formats.          |
| Security checks     | `src/security.ts`                               | Enforce owner isolation and document root restrictions.                         |

## Data flow

```text
MCP host
  -> stdio MCP server
  -> MindMapService
  -> RunQueue
  -> MindGeniusAI HTTP/SSE upstream
  -> event reducer
  -> FileStore
  -> MCP resources and export links
```

## Persistence model

The upstream remains mostly stateless across `/api/agent` requests. This
adapter owns durable `planningId`, `runId`, `documentId`, event history,
committed map versions, cancellation state, and idempotency keys.

Pending runs are recovered on startup. A run that was `queued` or `running`
when the process stopped is re-queued so the host can continue polling with the
same `planningId`.

## Boundaries

The adapter does not store LLM provider secrets. Provider configuration belongs
to the MindGeniusAI upstream. The adapter only stores workflow state and
artifact data needed for MCP callers.

For the upstream HTTP/SSE contract, see [UPSTREAM-CONTRACT.md](../UPSTREAM-CONTRACT.md).
