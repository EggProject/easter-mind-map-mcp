# easter-mind-map-mcp

> In-memory MCP adapter for MindGeniusAI mind-map generation, refinement, resources, and exports.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Bun%20%3E%3D1.3.0-black.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](tsconfig.json)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzio ->](README.hu.md)**

---

## What is this?

**`easter-mind-map-mcp`** is a Bun and TypeScript MCP server that wraps the
MindGeniusAI upstream application behind host-friendly tools. It keeps plan
state in memory for the current MCP process, supervises queued runs, preserves
stable IDs during that process, exposes MCP resources for plan data, and exports
finished maps as OPML, PNG, or Markdown through lazy resource reads.

The server speaks MCP over stdio. It does not expose an HTTP API of its own; it
calls a MindGeniusAI HTTP/SSE upstream configured with environment variables.

## Quick start

Clone the repository:

```bash
git clone https://github.com/EggProject/easter-mind-map-mcp.git
cd easter-mind-map-mcp
```

Then point your MCP host at the committed runtime file:

```json
{
  "mcpServers": {
    "easter-mind-map": {
      "command": "bun",
      "args": ["dist/index.js"],
      "cwd": "/absolute/path/to/easter-mind-map-mcp",
      "env": {
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3",
        "EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS": "documents"
      }
    }
  }
}
```

The MCP host runs `bun dist/index.js` from this repository. Bun `>=1.3.0` must
be available, and pnpm must be on `PATH` because the bundled
`original-MindGeniusAI` upstream uses it when the adapter starts the upstream
automatically.
For an existing checkout, run `git pull` before restarting the MCP host.

See [MCP host setup](docs/en/installation.md#configure-an-mcp-host) and the
[environment variable reference](docs/en/configuration.md#environment-variables)
for the full settings list.

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
src/                    MCP server, service layer, memory store, exports, upstream client
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

This project is licensed under the MIT License. See [LICENSE](LICENSE).
