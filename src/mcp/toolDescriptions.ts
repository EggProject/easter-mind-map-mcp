const prompt = (parts: string[]): string => parts.join(' ')

export const toolDescriptions = {
  mindmap_create: prompt([
    'Create a new in-memory MindGeniusAI mind-map plan and queue the first generation run.',
    'Use this first for every new user request that needs a generated mind map; include documentId only after a document was added and indexed.',
    'Do not invent a planningId, do not call continue/status/result/export before this returns, and do not wait inside this tool for generation to finish.',
    'Next action: preserve the returned planningId exactly, then call mindmap_get_status with that planningId.',
  ]),
  mindmap_continue: prompt([
    'Queue a refinement run for an existing plan, using the stored messages and current mindMap state.',
    'Use this only when the user asks to modify or improve a plan that already has a planningId.',
    'Do not create a new plan, do not start concurrent continuations for the same planningId, and do not alter the planningId.',
    'Next action: call mindmap_get_status with the same planningId until the refinement reaches a terminal status.',
  ]),
  mindmap_get_status: prompt([
    'Return compact progress metadata for one plan without loading the full map or event log.',
    'Use this repeatedly after mindmap_create or mindmap_continue while status is queued or running.',
    'Do not use this to inspect map content, do not assume completion before a completed status, and do not stop polling on queued/running unless the user cancels.',
    'Next action: poll again if queued/running, call mindmap_get_result if completed and content is needed, or report the error if failed/cancelled.',
  ]),
  mindmap_get_result: prompt([
    'Return the current or final mind-map content as outline, markdown, or summary.',
    'Use this after status is completed, or earlier only when the user explicitly asks to inspect the current snapshot.',
    'Do not use this for polling, do not use it as an export substitute, and do not request large content unless it is needed for the answer.',
    'Next action: when the map is ready, call mindmap_export with formats ["opml","png"] before final delivery.',
  ]),
  mindmap_cancel: prompt([
    'Cancel queued or running work for an existing plan and abort the upstream HTTP/SSE stream when possible.',
    'Use this when the user asks to stop, abort, cancel, or discard an active generation/refinement run.',
    'Do not treat cancellation as a successful map, do not export a cancelled unfinished run, and do not cancel other planningId values.',
    'Next action: call mindmap_get_status with the same planningId if confirmation is needed, then report the cancelled status.',
  ]),
  mindmap_list: prompt([
    'List caller-owned plans with short metadata only.',
    'Use this when the user asks what mind-map plans exist, asks to resume one, or did not provide a planningId.',
    "Do not expose another owner's plans, do not use list as a content fetch, and do not guess which planningId the user meant when multiple plans match.",
    'Next action: choose the relevant planningId with the user or context, then call mindmap_get_status or mindmap_get_result.',
  ]),
  mindmap_document_add: prompt([
    'Register a local PDF and upload it to MindGeniusAI so a later mind-map plan can use it for RAG.',
    'Use this before document indexing when the user wants the map grounded in a local PDF file.',
    'Do not pass URLs, raw file bytes, base64 content, secrets, or paths outside the configured document roots.',
    'Next action: preserve the returned documentId exactly, then call mindmap_document_index with that documentId.',
  ]),
  mindmap_document_index: prompt([
    'Initialize a previously uploaded PDF in the upstream RAG index.',
    'Use this after mindmap_document_add and before mindmap_create when the plan should use the document.',
    'Do not index arbitrary IDs, do not start duplicate indexing for the same documentId, and do not call mindmap_create with documentId until indexing succeeds.',
    "Next action: call mindmap_create with the exact indexed documentId and the user's mind-map prompt.",
  ]),
  mindmap_export: prompt([
    'Create versioned export resource links for a completed or otherwise committed plan version.',
    'Use this as the required final step for a successful map; request both opml and png unless the user explicitly asks for a different additional format.',
    'Do not return OPML or PNG inline, do not export before a mindMap exists, and do not omit png/opml from a normal completed flow.',
    'Next action: return the resource links to the user and read individual resources only when their bytes or text are needed.',
  ]),
  mindmap_guide: prompt([
    'Return the deterministic AI-readable recipe for using this MCP server correctly from start to export.',
    'Use this when tool order, required IDs, document flow, polling, or final export requirements are uncertain.',
    "Do not replace the actual tool calls with a prose answer and do not skip the recipe's required export finish.",
    'Next action: follow the returned recipe exactly, ending successful map generation with mindmap_export.',
  ]),
} as const
