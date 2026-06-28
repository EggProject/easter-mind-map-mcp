# Installation

🇭🇺 **[Magyar verzio ->](../hu/installation.md)**

## Requirements

- Bun `>=1.3.0`
- pnpm available on `PATH` for automatic bundled upstream installation/startup
- A MindGeniusAI upstream server reachable over HTTP
- An MCP host that can launch a stdio server

## Install dependencies

For an existing checkout, pull the latest committed runtime artifact first:

```bash
git pull
```

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
        "EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL": "http://127.0.0.1:8787",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
        "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3",
        "EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS": "documents"
      }
    }
  }
}
```

During your own development, re-run `bun run build` after each source change
before restarting the MCP host.

Provider variables must be present in the environment of the MCP server process
that runs `bun dist/index.js`. Shell startup files such as `~/.zshrc` are not a
reliable source for MCP hosts unless the host process was launched from that
same shell session. For reliable setup, put `EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER`,
`EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY`, and related values in the MCP host `env`
block, or start the MCP host from an environment where those variables are
already exported.

If the upstream is not already running, the adapter starts
`original-MindGeniusAI` with `pnpm --dir original-MindGeniusAI dev:server` by
default. If `original-MindGeniusAI/node_modules` is missing, it first runs
`pnpm --dir original-MindGeniusAI install --frozen-lockfile`. Override
`EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND` or `EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND` only when you want a
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
`EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL` at the server URL that exposes `/api/health`, `/api/agent`,
`/api/uploadFile`, and `/api/document/init`.
