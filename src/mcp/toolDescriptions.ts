export const toolDescriptions = {
  mindmap_create:
    'Create a new persistent MindGeniusAI mind-map plan and queue the first generation run. Use this first for a new requested map. Do not wait inside the tool for generation to finish. Next action: call mindmap_get_status with the returned planningId.',
  mindmap_continue:
    'Continue an existing persistent plan with a new instruction, using the previous messages and current mindMap state. Use only after mindmap_create has returned a planningId. Do not start concurrent continuations for the same planningId. Next action: call mindmap_get_status.',
  mindmap_get_status:
    'Return short progress metadata for a plan. Use this for polling. Do not use it to fetch the full map or event log. Next action: poll again, call mindmap_get_result if completed, or report the failure.',
  mindmap_get_result:
    'Return the current or final mind-map result in outline, markdown, or summary form. Use after status is completed or when the current snapshot is explicitly needed. Do not use this for polling. Next action: call mindmap_export for OPML and PNG.',
  mindmap_cancel:
    'Cancel a queued or running plan run and abort the upstream HTTP/SSE stream. Use when the user asks to stop generation. Do not treat cancellation as a successful export. Next action: call mindmap_get_status if confirmation is needed.',
  mindmap_list:
    'List the caller-owned plans with short metadata. Use when the user asks what plans exist. Do not expose another owner’s plans. Next action: choose a planningId and call mindmap_get_status or mindmap_get_result.',
  mindmap_document_add:
    'Register a local PDF document and upload it to MindGeniusAI for later RAG use. Use before mindmap_document_index. Do not pass arbitrary URLs or large base64 content through the LLM context. Next action: call mindmap_document_index with the returned documentId.',
  mindmap_document_index:
    'Initialize the uploaded PDF document in the upstream RAG index. Use after mindmap_document_add and before mindmap_create with documentId. Do not start duplicate indexing for the same documentId. Next action: call mindmap_create with documentId.',
  mindmap_export:
    'Export a committed plan version. Use as the required final step after a map is complete. Do not return OPML or PNG inline; return resource links for large artifacts. Next action: read the returned resources only when needed.',
  mindmap_guide:
    'Return the deterministic AI-readable recipe for using this MCP server correctly. Use when tool order is uncertain. Do not replace the actual tool calls with a prose answer. Next action: follow the recipe through mindmap_export.',
} as const
