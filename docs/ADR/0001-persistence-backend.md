# ADR 0001: Persistence Backend

## Decision

The adapter defines a `Store` interface and ships with a durable JSON `FileStore` implementation for local Bun deployments.

## Rationale

The acceptance criteria require plans to reload after MCP and worker restarts. A file store satisfies that requirement without requiring a local PostgreSQL service during development. The interface keeps the PostgreSQL backend isolated as an operational replacement rather than a tool or reducer concern.

## Consequences

- Local development and tests run without external services.
- Production deployments can add a PostgreSQL implementation behind the same `Store` interface.
- The file store is not intended for multi-process shared writes.
