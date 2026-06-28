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
| Store               | `src/store.ts`                                  | Keep plans, runs, events, documents, and idempotency records in process memory. |
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
  -> MemoryStore
  -> MCP resources and export links
```

## Runtime State Model

The upstream remains mostly stateless across `/api/agent` requests. This
adapter owns `planningId`, `runId`, `documentId`, event history, committed map
versions, cancellation state, and idempotency keys in process memory.

Restarting the MCP server clears in-memory plans, runs, idempotency keys,
document metadata, and export snapshots. Pending runs are not recovered after
restart.

`mindmap_export` returns versioned resource links such as
`mindmap://exports/{planningId}/{version}/png`. The adapter does not store PNG,
OPML, or Markdown export payloads. When a host reads an export resource, the MCP
server calls the MindGeniusAI `/api/export` endpoint for that version snapshot
and streams the returned payload back through the MCP resource response.

## Boundaries

The adapter does not store LLM provider secrets. Provider configuration belongs
to the MindGeniusAI upstream. The adapter only keeps current workflow state in
memory for MCP callers.

For the upstream HTTP/SSE contract, see [UPSTREAM-CONTRACT.md](../UPSTREAM-CONTRACT.md).
