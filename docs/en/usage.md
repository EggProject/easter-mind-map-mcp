# Usage

🇭🇺 **[Magyar verzio ->](../hu/usage.md)**

The MCP host should treat this server as a stateful workflow adapter. Start with
`mindmap_create`, poll status, inspect results only when useful, and finish with
an export.

## Basic workflow

1. Call `mindmap_create` with the user's topic or goal.
2. Preserve the returned `planningId` exactly.
3. Poll `mindmap_get_status` until the plan is `completed` or `failed`.
4. Call `mindmap_get_result` with `outline`, `markdown`, or `summary` when the
   host needs the map content.
5. Call `mindmap_export` with `opml` and `png` before presenting final output.

## Example host sequence

```text
mindmap_create({ prompt: "Plan an Easter project" })
mindmap_get_status({ planningId })
mindmap_get_status({ planningId })
mindmap_get_result({ planningId, format: "outline" })
mindmap_export({ planningId, formats: ["opml", "png"] })
```

## Refinement

Use `mindmap_continue` after a plan exists:

```text
mindmap_continue({
  planningId,
  instruction: "Add a testing branch and make the deployment branch shorter."
})
```

After a continuation, return to status polling. Do not start concurrent
continuations for the same `planningId`; the service serializes work per plan.

## Document-assisted maps

For PDF-backed generation:

1. Place the PDF under a configured `EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS` directory.
2. Call `mindmap_document_add` with `{ source: { type: "local_path", path } }`.
3. Call `mindmap_document_index` with the returned `documentId`.
4. Call `mindmap_create` with that `documentId`.

The adapter passes the document to the upstream and keeps the caller-facing
`documentId` stable.

## Outputs

Generated artifacts are returned as versioned MCP resource links instead of
inline binary payloads. Read
`mindmap://exports/{planningId}/{version}/opml` or
`mindmap://exports/{planningId}/{version}/png` only when the host needs the
artifact content. The MCP server calls MindGeniusAI export at resource-read time.
