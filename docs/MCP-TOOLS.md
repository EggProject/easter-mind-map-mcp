# MCP Tools

The MCP server exposes these LLM-facing tools. Tool descriptions are written as prompts and include when to call the tool, what not to do, and the next action.

- `mindmap_create`
- `mindmap_continue`
- `mindmap_get_status`
- `mindmap_get_result`
- `mindmap_cancel`
- `mindmap_list`
- `mindmap_document_add`
- `mindmap_document_index`
- `mindmap_export`
- `mindmap_guide`

Large plan content and export binaries are addressed as resources:

- `mindmap://plans/{planningId}`
- `mindmap://plans/{planningId}/outline`
- `mindmap://plans/{planningId}/markdown`
- `mindmap://plans/{planningId}/events`
- `mindmap://exports/{planningId}/opml`
- `mindmap://exports/{planningId}/png`
- `mindmap://guide`

Required autonomous flow:

1. `mindmap_create(prompt[, documentId])`
2. Poll `mindmap_get_status(planningId)` until completed or failed.
3. Optionally refine with `mindmap_continue(planningId, instruction)` and return to status polling.
4. Read result with `mindmap_get_result(planningId, format)`.
5. Finish with `mindmap_export(planningId, formats:['opml','png'])`.
