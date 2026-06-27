# easter-mind-map-mcp

> Persistent MCP adapter for MindGeniusAI mind-map generation, refinement, resources, and exports.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](package.json)
[![Runtime](https://img.shields.io/badge/runtime-Bun%20%3E%3D1.3.0-black.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](tsconfig.json)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzio ->](README.hu.md)**

---

## What is this?

**`easter-mind-map-mcp`** is a Bun and TypeScript MCP server that wraps the
MindGeniusAI upstream application behind persistent, host-friendly tools. It
stores plan state locally, supervises queued runs, preserves stable IDs, exposes
MCP resources for plan data, and exports finished maps as OPML, PNG, or
Markdown.

The server speaks MCP over stdio. It does not expose an HTTP API of its own; it
calls a MindGeniusAI HTTP/SSE upstream configured with environment variables.

## Quick start

```bash
bun install
bun dist/index.js
```

The committed `dist/index.js` is the runtime entrypoint for MCP hosts. Build from
source only when you change the TypeScript files during your own development.
When the upstream is not already healthy, the adapter starts the bundled
`original-MindGeniusAI` server automatically with `pnpm --dir
original-MindGeniusAI dev:server`.
Set MindGeniusAI provider variables such as `MINDGENIUS_ENV_LLM_PROVIDER` and
`MINDGENIUS_ENV_MINIMAX_API_KEY` in the MCP host environment.
Logging is off by default with `LOGLEVEL=NONE`; set `LOGLEVEL=DEBUG` to write
detailed adapter and MindGeniusAI server output under `logs/`.

For MCP host setup, upstream configuration, and the required tool flow, use the
split documentation below instead of keeping everything in this file.

## Documentation

- 📖 **[Documentation index](docs/README.md)**
- 📦 **[Installation](docs/en/installation.md)**
- ⚙️ **[Configuration](docs/en/configuration.md)**
- ▶️ **[Usage](docs/en/usage.md)**
- 🧰 **[Tool reference](docs/en/tool-reference.md)**
- 🏗️ **[Architecture](docs/en/architecture.md)**

Existing engineering notes:

- 🧭 **[MCP tool contract](docs/MCP-TOOLS.md)**
- 🔌 **[MindGeniusAI upstream contract](docs/UPSTREAM-CONTRACT.md)**
- 🧱 **[Architecture decisions](docs/ADR/)**

## Project layout

```text
src/                    MCP server, service layer, storage, exports, upstream client
dist/                   Committed MCP runtime entrypoint for host configuration
test/                   Bun tests for service behavior and MCP stdio integration
docs/                   User documentation, contracts, ADRs, and planning notes
original-MindGeniusAI/  Upstream MindGeniusAI application snapshot
```

## Scripts

| Command                | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `bun test`             | Run the Bun test suite.                                          |
| `bun run build`        | Development only: type-check source and refresh `dist/index.js`. |
| `bun run lint`         | Run ESLint.                                                      |
| `bun run format:check` | Check Prettier formatting.                                       |
| `bun run format`       | Format matched files with Prettier.                              |

## License

No root `LICENSE` file is declared in this adapter repository.
