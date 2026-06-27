# ADR 0002: PNG Export

## Decision

The MCP server generates deterministic server-side PNG artifacts from the committed outline.

## Rationale

The upstream application exports PNG in the browser through AntV X6. The MCP server needs headless operation and resource-linked artifacts, so it uses a deterministic server-side renderer that encodes a valid PNG without opening a browser.

## Consequences

- PNG export works in stdio and server environments.
- Visual fidelity is intentionally lower than the upstream browser canvas.
- A Playwright/X6 renderer can be added later as a fidelity backend without changing the `mindmap_export` tool contract.
