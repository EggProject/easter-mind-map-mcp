# Installation

🇭🇺 **[Magyar verzio ->](../hu/installation.md)**

## Requirements

- Bun `>=1.3.0`
- A MindGeniusAI upstream server reachable over HTTP
- An MCP host that can launch a stdio server

## Install dependencies

```bash
bun install
```

Run the verification commands before wiring the server into an MCP host:

```bash
bun test
bun run build
bun run format:check
```

## Run the MCP server directly

```bash
bun src/index.ts
```

The process starts an MCP stdio server and waits for the host to speak the MCP
protocol. It is not an interactive shell command.

## Configure an MCP host

Use the repository root as the working directory so relative paths such as
`data/` and `documents/` resolve inside this project.

```json
{
  "mcpServers": {
    "easter-mind-map": {
      "command": "bun",
      "args": ["src/index.ts"],
      "cwd": "/absolute/path/to/easter-mind-map-mcp",
      "env": {
        "MINDGENIUS_BASE_URL": "http://127.0.0.1:8787",
        "MINDMAP_DATA_DIR": "data",
        "MINDMAP_DOCUMENT_ROOTS": "documents"
      }
    }
  }
}
```

If the upstream is not already running, set `MINDGENIUS_START_COMMAND` to a
command that starts it. The adapter checks `/api/health` before each upstream
run and waits for the configured health timeout.

## Upstream application

The repository contains an upstream snapshot in `original-MindGeniusAI/`. Its
own scripts use `pnpm`; keep that application configured separately from this
adapter.

```bash
cd original-MindGeniusAI
pnpm install
pnpm dev:server
```

Point `MINDGENIUS_BASE_URL` at the server URL that exposes `/api/health`,
`/api/agent`, `/api/uploadFile`, and `/api/document/init`.
