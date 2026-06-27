# Tool reference

🇭🇺 **[Magyar verzio ->](../hu/tool-reference.md)**

This page summarizes the MCP tools exposed by the stdio server. The exact
LLM-facing wording lives in `src/mcp/toolDescriptions.ts`.

## Tools

| Tool                     | Use                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| `mindmap_create`         | Create a persistent plan and queue the first generation run.          |
| `mindmap_continue`       | Add a refinement instruction to an existing plan.                     |
| `mindmap_get_status`     | Poll short progress metadata for a plan.                              |
| `mindmap_get_result`     | Read the current or final map as `outline`, `markdown`, or `summary`. |
| `mindmap_cancel`         | Cancel queued or running work for a plan.                             |
| `mindmap_list`           | List caller-owned plans with short metadata.                          |
| `mindmap_document_add`   | Register and upload a local PDF for later RAG use.                    |
| `mindmap_document_index` | Initialize the uploaded PDF in the upstream RAG index.                |
| `mindmap_export`         | Export a committed plan version as OPML, PNG, or Markdown.            |
| `mindmap_guide`          | Return the deterministic tool-use recipe for the host.                |

## Main resources

| URI                                     | Content                     |
| --------------------------------------- | --------------------------- |
| `mindmap://guide`                       | Tool-use guide as Markdown. |
| `mindmap://plans/{planningId}`          | Stored plan JSON.           |
| `mindmap://plans/{planningId}/outline`  | Current outline JSON.       |
| `mindmap://plans/{planningId}/markdown` | Current map Markdown.       |
| `mindmap://plans/{planningId}/events`   | Event log as NDJSON.        |
| `mindmap://exports/{planningId}/opml`   | OPML export.                |
| `mindmap://exports/{planningId}/png`    | PNG export.                 |

## Final-step rule

The expected successful flow ends with:

```text
mindmap_export({ planningId, formats: ["opml", "png"] })
```

Use `mindmap_get_result` to inspect map content; use `mindmap_export` to produce
deliverable artifacts.
