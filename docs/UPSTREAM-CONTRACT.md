# MindGeniusAI Upstream Contract

This document captures the integration contract used by the MCP adapter.

## HTTP Endpoints

- `GET /api/health` returns `{ "ok": true }` when the upstream server is ready.
- `POST /api/agent` accepts `{ messages, fileName?, mindMap? }` and returns Server-Sent Events.
- `POST /api/export` accepts `{ mindMap, markdown?, formats }` and returns export artifacts.
- `POST /api/uploadFile` accepts one PDF multipart file and returns an upstream `fileName`.
- `POST /api/document/init` accepts `{ fileName }` and initializes the in-process RAG index.

## Agent SSE Protocol

Every SSE frame carries a JSON envelope:

```ts
type SseEnvelope = { status: 'pending' | 'done' | 'failed'; data?: string }
```

For `/api/agent`, structured events are encoded in `pending.data` with the `agent:` prefix followed by JSON. Non-prefixed data is legacy token text and is ignored by the MCP reducer.

Handled `AgentEvent` variants:

- `text`
- `tool-call`
- `tool-result`
- `mindmap-patch`
- `mindmap-set`
- `step-finish`
- `error`

## State Contract

MindGeniusAI remains stateless across `/api/agent` requests except for its
in-process RAG index. The MCP adapter owns `planningId`, `runId`, `documentId`,
events, committed map versions, cancellation, idempotency, and concurrency in
process memory only. Export payloads are not stored by the MCP adapter; export
resources call `/api/export` lazily when the MCP host reads the resource.
