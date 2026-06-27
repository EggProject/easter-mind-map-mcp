# Configuration

🇭🇺 **[Magyar verzio ->](../hu/configuration.md)**

The server reads configuration from environment variables at startup. Relative
paths resolve from the process working directory.

## Environment variables

| Variable                       | Default                                                      | Purpose                                                                                   |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `MINDGENIUS_BASE_URL`          | `http://127.0.0.1:8787`                                      | Base URL for the MindGeniusAI upstream HTTP server.                                       |
| `MINDGENIUS_START_COMMAND`     | `pnpm --dir original-MindGeniusAI dev:server`                | Command used to start the upstream if health checks fail.                                 |
| `MINDGENIUS_INSTALL_COMMAND`   | `pnpm --dir original-MindGeniusAI install --frozen-lockfile` | Command used once when bundled upstream dependencies are missing.                         |
| `MINDGENIUS_HEALTH_TIMEOUT_MS` | `30000`                                                      | Maximum wait time for the upstream health check after startup.                            |
| `LOGLEVEL`                     | `NONE`                                                       | File logging level: `NONE`, `ERROR`, `WARN`, `INFO`, or `DEBUG`.                          |
| `LOGPATH`                      | `logs/easter-mind-map-mcp.log`                               | Log file name or path. The adapter keeps it inside the project `logs/` directory.         |
| `MINDMAP_DATA_DIR`             | `data`                                                       | Local persistence directory for plans, runs, documents, exports, and idempotency records. |
| `MINDMAP_DOCUMENT_ROOTS`       | `documents`                                                  | Comma-separated list of directories from which local PDF documents may be uploaded.       |
| `MINDMAP_MAX_RUNS_GLOBAL`      | `4`                                                          | Global concurrent generation run limit.                                                   |
| `MINDMAP_MAX_RUNS_PER_OWNER`   | `2`                                                          | Concurrent generation run limit per owner.                                                |
| `MINDMAP_MAX_DOCUMENT_INDEXES` | `2`                                                          | Concurrent document indexing limit.                                                       |
| `MINDMAP_UPSTREAM_TIMEOUT_MS`  | `180000`                                                     | Timeout for a single upstream SSE request.                                                |
| `MINDMAP_MAX_RETRIES`          | `1`                                                          | Retry count for failed queued runs.                                                       |

## Runtime directories

`MINDMAP_DATA_DIR` stores adapter-owned state. Keep it writable by the MCP
server process and do not use it for source files.

`LOGPATH` writes under the project `logs/` directory, which is ignored by git.
Logging is disabled by default with `LOGLEVEL=NONE`. Use `LOGLEVEL=DEBUG` when
you need detailed MCP adapter events and the bundled MindGeniusAI server
stdout/stderr output.

`MINDMAP_DOCUMENT_ROOTS` limits which local PDFs can be uploaded through
`mindmap_document_add`. Paths outside these roots are rejected before they reach
the upstream.

## Upstream startup

By default, the adapter starts the bundled `original-MindGeniusAI` server after
the first failed health check and only once per server process. The command is
split on whitespace and launched with Bun's process runner.

Before startup, the adapter checks `original-MindGeniusAI/node_modules`. If it is
missing, it runs `MINDGENIUS_INSTALL_COMMAND` first, so a fresh checkout can run
without manually entering the upstream directory.

For complex startup commands, prefer a small wrapper script and set
`MINDGENIUS_START_COMMAND` to that script path.

## MindGeniusAI environment

The upstream process receives the MCP server environment. You can set
MindGeniusAI variables directly in the MCP host config, for example
`LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `MINIMAX_API_KEY`,
`MINIMAX_MODEL`, `EMBEDDING_API_KEY`, `DISABLE_UPLOAD`, and `MAX_UPLOAD_MB`.

The MCP server can only forward variables that are visible in its own
`process.env` when `bun dist/index.js` starts. Shell startup files such as
`~/.zshrc` do not automatically apply to every MCP host process. If you rely on
a shell file, start the MCP host from that shell session; otherwise put the
provider variables in the MCP host `env` block.

You can also use the `MINDGENIUS_ENV_` prefix to avoid collisions. The adapter
strips the prefix before starting the upstream:

```json
{
  "env": {
    "MINDGENIUS_ENV_LLM_PROVIDER": "minimax",
    "MINDGENIUS_ENV_MINIMAX_API_KEY": "sk-...",
    "MINDGENIUS_ENV_MINIMAX_MODEL": "MiniMax-M3"
  }
}
```

With `LOGLEVEL=DEBUG`, the startup log includes the environment keys that the
adapter forwards to MindGeniusAI. Secret-looking values are redacted, so a
present API key appears as `<redacted>` instead of the raw value. If a key is not
listed there, the MCP server process did not receive it.

If `MINDGENIUS_BASE_URL` is not set, `MINDGENIUS_ENV_PORT` or `PORT` also
changes the default health-check URL. Otherwise the adapter sets `PORT=8787` for
the bundled upstream so the default health check and started server match.
