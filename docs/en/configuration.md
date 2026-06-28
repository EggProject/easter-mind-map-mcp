# Configuration

🇭🇺 **[Magyar verzio ->](../hu/configuration.md)**

The server reads configuration from environment variables at startup. Relative
paths resolve from the repository root detected from `dist/index.js`.

## Environment variables

| Variable                                           | Default                                                      | Purpose                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL`          | `http://127.0.0.1:8787`                                      | Base URL for the MindGeniusAI upstream HTTP server.                                      |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND`     | `pnpm --dir original-MindGeniusAI dev:server`                | Command used to start the upstream if health checks fail.                                |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND`   | `pnpm --dir original-MindGeniusAI install --frozen-lockfile` | Command used once when bundled upstream dependencies are missing.                        |
| `EASTER_MIND_MAP_MCP_MINDGENIUS_HEALTH_TIMEOUT_MS` | `30000`                                                      | Maximum wait time for the upstream health check after startup.                           |
| `EASTER_MIND_MAP_MCP_LOGLEVEL`                     | `NONE`                                                       | File logging level: `NONE`, `ERROR`, `WARN`, `INFO`, or `DEBUG`.                         |
| `EASTER_MIND_MAP_MCP_LOGPATH`                      | `/tmp/easter-mind-map-mcp/logs/mcp.log`                      | Log file path.                                                                           |
| `EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR`             | `/tmp/easter-mind-map-mcp/data`                              | Reserved runtime data directory. Plan, run, and export artifact state is kept in memory. |
| `EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS`       | `/tmp/easter-mind-map-mcp/documents`                         | Comma-separated list of directories from which local PDF documents may be uploaded.      |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_RUNS_GLOBAL`      | `4`                                                          | Global concurrent generation run limit.                                                  |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_RUNS_PER_OWNER`   | `2`                                                          | Concurrent generation run limit per owner.                                               |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_DOCUMENT_INDEXES` | `2`                                                          | Concurrent document indexing limit.                                                      |
| `EASTER_MIND_MAP_MCP_MINDMAP_UPSTREAM_TIMEOUT_MS`  | `180000`                                                     | Timeout for a single upstream SSE request.                                               |
| `EASTER_MIND_MAP_MCP_MINDMAP_MAX_RETRIES`          | `1`                                                          | Retry count for failed queued runs.                                                      |

## Runtime directories

Plan, run, idempotency, document metadata, and export snapshots are kept in
memory for the lifetime of the MCP process. Restarting the MCP server clears that
state. `EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR` is reserved for runtime data but
the default implementation does not write a `state.json` file.

`EASTER_MIND_MAP_MCP_LOGPATH` defaults to `/tmp/easter-mind-map-mcp/logs/mcp.log`.
Logging is disabled by default with `EASTER_MIND_MAP_MCP_LOGLEVEL=NONE`. Use
`EASTER_MIND_MAP_MCP_LOGLEVEL=DEBUG` when you need detailed MCP adapter events
and the bundled MindGeniusAI server stdout/stderr output.

`EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS` limits which local PDFs can be uploaded through
`mindmap_document_add`. Paths outside these roots are rejected before they reach
the upstream.

## Upstream startup

By default, the adapter starts the bundled `original-MindGeniusAI` server after
the first failed health check and only once per server process. The command is
split on whitespace and launched with Bun's process runner.

Before startup, the adapter checks `original-MindGeniusAI/node_modules`. If it is
missing, it runs `EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND` first, so a fresh checkout can run
without manually entering the upstream directory.

For complex startup commands, prefer a small wrapper script and set
`EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND` to that script path.

## MindGeniusAI environment

The upstream process receives basic system environment such as `PATH` plus
MindGeniusAI variables explicitly provided with the
`EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_` prefix. The adapter strips that prefix
before starting MindGeniusAI, so
`EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY` becomes
`MINIMAX_API_KEY` upstream.

The MCP server can only forward variables that are visible in its own
`process.env` when `bun dist/index.js` starts. Shell startup files such as
`~/.zshrc` do not automatically apply to every MCP host process. If you rely on
a shell file, start the MCP host from that shell session; otherwise put the
provider variables in the MCP host `env` block.

Use this prefix for provider settings:

```json
{
  "env": {
    "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
    "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
    "EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3"
  }
}
```

With `EASTER_MIND_MAP_MCP_LOGLEVEL=DEBUG`, the startup log includes the environment keys that the
adapter forwards to MindGeniusAI. Secret-looking values are redacted, so a
present API key appears as `<redacted>` instead of the raw value. If a key is not
listed there, the MCP server process did not receive it.

If `EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL` is not set,
`EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_PORT` changes the default health-check URL.
Otherwise the adapter sets `PORT=8787` for the bundled upstream so the default
health check and started server match.
