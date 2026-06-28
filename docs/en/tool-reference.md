# Tool reference

🇭🇺 **[Magyar verzio ->](../hu/tool-reference.md)**

This page summarizes the MCP tools exposed by the stdio server. The exact
LLM-facing wording lives in `src/mcp/toolDescriptions.ts` and the parameter
prompts live in `src/mcp/server.ts`.

Tool and parameter descriptions are part of the prompt surface. They are written
to make the host preserve returned IDs exactly, poll until terminal status, avoid
unsafe document inputs, and finish successful maps with OPML and PNG export.

## Tools

| Tool                     | Use                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| `mindmap_create`         | Create an in-memory plan and queue the first generation run.          |
| `mindmap_continue`       | Add a refinement instruction to an existing plan.                     |
| `mindmap_get_status`     | Poll short progress metadata for a plan.                              |
| `mindmap_get_result`     | Read the current or final map as `outline`, `markdown`, or `summary`. |
| `mindmap_cancel`         | Cancel queued or running work for a plan.                             |
| `mindmap_list`           | List caller-owned plans with short metadata.                          |
| `mindmap_document_add`   | Register and upload a local PDF for later RAG use.                    |
| `mindmap_document_index` | Initialize the uploaded PDF in the upstream RAG index.                |
| `mindmap_export`         | Export a committed plan version as OPML, PNG, or Markdown.            |
| `mindmap_guide`          | Return the deterministic tool-use recipe for the host.                |

## Parameter prompt rules

- `planningId`, `runId`, `documentId`, `resourceUri`, and `version` values must
  come from tool results and must be preserved byte-for-byte.
- `prompt` carries the user goal and map constraints; it is not a place for API
  keys or host configuration.
- `documentId` is valid for `mindmap_create` only after
  `mindmap_document_add` and `mindmap_document_index` both succeed.
- `source.path` for `mindmap_document_add` must be a local PDF path under an
  allowed document root. URLs, base64, raw bytes, and secrets are not accepted.
- `formats` may be omitted for the required default `["opml", "png"]`; add
  `markdown` only when it is useful.

## Main resources

| URI                                             | Content                       |
| ----------------------------------------------- | ----------------------------- |
| `mindmap://guide`                               | Tool-use guide as Markdown.   |
| `mindmap://plans/{planningId}`                  | Stored plan JSON.             |
| `mindmap://plans/{planningId}/outline`          | Current outline JSON.         |
| `mindmap://plans/{planningId}/markdown`         | Current map Markdown.         |
| `mindmap://plans/{planningId}/events`           | Event log as NDJSON.          |
| `mindmap://exports/{planningId}/{version}/opml` | OPML export generated lazily. |
| `mindmap://exports/{planningId}/{version}/png`  | PNG export generated lazily.  |

## Final-step rule

The expected successful flow ends with:

```text
mindmap_export({ planningId, formats: ["opml", "png"] })
```

Use `mindmap_get_result` to inspect map content; use `mindmap_export` to produce
versioned resource links. Reading those links calls MindGeniusAI export lazily.
