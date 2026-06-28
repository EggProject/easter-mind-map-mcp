# ADR 0001: Runtime State Backend

## Decision

The adapter defines a `Store` interface and ships with an in-memory `MemoryStore`
implementation. It does not write `state.json`, and it does not persist export
payloads.

## Rationale

The MCP adapter is intended to be a thin runtime bridge between the caller and
MindGeniusAI. Persisting all plan state and binary exports in one JSON file
creates multi-process write conflicts, unbounded file growth, and cleanup
responsibility that belongs outside the adapter's core flow.

Plan, run, document metadata, event, and idempotency state live only for the
current MCP process. Export resources are versioned, but the adapter stores only
the small in-memory plan snapshot needed to reproduce the export. When the host
reads an export resource, the adapter calls MindGeniusAI `/api/export` and
returns the payload immediately.

## Consequences

- Local development and tests run without external storage.
- Multiple MCP processes do not contend for a shared `state.json`.
- Restarting the MCP process clears plans, runs, idempotency keys, document
  metadata, and export snapshots.
- Old export resource links stop working after restart or after the in-memory
  snapshot is gone.
