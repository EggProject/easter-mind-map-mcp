# Configuration

🇭🇺 **[Magyar verzio ->](../hu/configuration.md)**

The server reads configuration from environment variables at startup. Relative
paths resolve from the process working directory.

## Environment variables

| Variable                       | Default                 | Purpose                                                                                   |
| ------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `MINDGENIUS_BASE_URL`          | `http://127.0.0.1:8787` | Base URL for the MindGeniusAI upstream HTTP server.                                       |
| `MINDGENIUS_START_COMMAND`     | unset                   | Optional command used to start the upstream if health checks fail.                        |
| `MINDGENIUS_HEALTH_TIMEOUT_MS` | `30000`                 | Maximum wait time for the upstream health check after startup.                            |
| `MINDMAP_DATA_DIR`             | `data`                  | Local persistence directory for plans, runs, documents, exports, and idempotency records. |
| `MINDMAP_DOCUMENT_ROOTS`       | `documents`             | Comma-separated list of directories from which local PDF documents may be uploaded.       |
| `MINDMAP_MAX_RUNS_GLOBAL`      | `4`                     | Global concurrent generation run limit.                                                   |
| `MINDMAP_MAX_RUNS_PER_OWNER`   | `2`                     | Concurrent generation run limit per owner.                                                |
| `MINDMAP_MAX_DOCUMENT_INDEXES` | `2`                     | Concurrent document indexing limit.                                                       |
| `MINDMAP_UPSTREAM_TIMEOUT_MS`  | `180000`                | Timeout for a single upstream SSE request.                                                |
| `MINDMAP_MAX_RETRIES`          | `1`                     | Retry count for failed queued runs.                                                       |

## Runtime directories

`MINDMAP_DATA_DIR` stores adapter-owned state. Keep it writable by the MCP
server process and do not use it for source files.

`MINDMAP_DOCUMENT_ROOTS` limits which local PDFs can be uploaded through
`mindmap_document_add`. Paths outside these roots are rejected before they reach
the upstream.

## Upstream startup

When `MINDGENIUS_START_COMMAND` is set, the adapter starts the command only
after the first failed health check and only once per server process. The
command is split on whitespace and launched with Bun's process runner.

For complex startup commands, prefer a small wrapper script and set
`MINDGENIUS_START_COMMAND` to that script path.
