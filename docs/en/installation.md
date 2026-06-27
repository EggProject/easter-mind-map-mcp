# Installation

🇭🇺 **[Magyar verzio ->](../hu/installation.md)**

## Requirements

- Bun `>=1.3.0`
- pnpm available on `PATH` for automatic bundled upstream installation/startup
- A MindGeniusAI upstream server reachable over HTTP
- An MCP host that can launch a stdio server

## Install dependencies

```bash
bun install
```

Run the server directly from the committed runtime artifact:

```bash
bun dist/index.js
```

The repository commits `dist/index.js`. Configure MCP hosts to run that file,
not the TypeScript source file. You only need `bun run build` when developing
against changed source files and refreshing `dist/index.js`.

## Run the MCP server directly

```bash
bun dist/index.js
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
      "args": ["dist/index.js"],
      "cwd": "/absolute/path/to/easter-mind-map-mcp",
      "env": {
        "MINDGENIUS_BASE_URL": "http://127.0.0.1:8787",
        "MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
        "MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
        "MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3",
        "MINDMAP_DATA_DIR": "data",
        "MINDMAP_DOCUMENT_ROOTS": "documents"
      }
    }
  }
}
```

During your own development, re-run `bun run build` after each source change
before restarting the MCP host.

If the upstream is not already running, the adapter starts
`original-MindGeniusAI` with `pnpm --dir original-MindGeniusAI dev:server` by
default. If `original-MindGeniusAI/node_modules` is missing, it first runs
`pnpm --dir original-MindGeniusAI install --frozen-lockfile`. Override
`MINDGENIUS_START_COMMAND` or `MINDGENIUS_INSTALL_COMMAND` only when you want a
different command. The adapter checks `/api/health` before each upstream run and
waits for the configured health timeout.

## Upstream application

The repository contains the upstream server in `original-MindGeniusAI/`. Its own
scripts use `pnpm`; the adapter installs dependencies automatically when needed.

```bash
cd original-MindGeniusAI
pnpm install
pnpm dev:server
```

Use those commands only when you want to run the upstream manually. Point
`MINDGENIUS_BASE_URL` at the server URL that exposes `/api/health`, `/api/agent`,
`/api/uploadFile`, and `/api/document/init`.
