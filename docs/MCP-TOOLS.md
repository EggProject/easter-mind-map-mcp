# MCP Tools

The MCP server exposes these LLM-facing tools. Tool names, descriptions, and
parameter descriptions are prompts: they must tell the host when to call a tool,
what IDs to preserve, what not to do, and what the next tool call should be.

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

Prompt contract for every tool description:

- **Use**: the exact situation where this tool is the right next call.
- **Do not**: common wrong calls, guessed IDs, skipped polling, inline binary
  output, or unsafe document inputs.
- **Next action**: the tool call or user-facing terminal action that should
  follow.

Prompt contract for every parameter description:

- Identify whether the parameter is required or optional.
- State the source of ID parameters, for example "exact planningId returned by
  `mindmap_create`".
- State invariants that the host must preserve, especially no invented,
  shortened, translated, or reformatted IDs.
- Keep secrets and large content out of tool arguments unless the schema
  explicitly accepts them.

Large plan content and export binaries are addressed as resources:

- `mindmap://plans/{planningId}`
- `mindmap://plans/{planningId}/outline`
- `mindmap://plans/{planningId}/markdown`
- `mindmap://plans/{planningId}/events`
- `mindmap://exports/{planningId}/{version}/opml`
- `mindmap://exports/{planningId}/{version}/png`
- `mindmap://guide`

Required autonomous flow:

1. `mindmap_create(prompt[, documentId])`
2. Preserve the returned `planningId` exactly.
3. Poll `mindmap_get_status(planningId)` until `completed`, `failed`, or
   `cancelled`.
4. Optionally refine with `mindmap_continue(planningId, instruction)` and return
   to status polling.
5. Read content with `mindmap_get_result(planningId, format)` only when needed.
6. Finish every successful completed map with
   `mindmap_export(planningId, formats:['opml','png'])`.

Document-grounded autonomous flow:

1. `mindmap_document_add(source:{type:'local_path', path})`
2. Preserve the returned `documentId` exactly.
3. `mindmap_document_index(documentId)`
4. `mindmap_create(prompt, documentId)`
5. Continue with status polling, optional result inspection, and required export.
