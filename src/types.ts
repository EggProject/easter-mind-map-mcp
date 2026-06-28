export type PlanningStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface AgentMessage {
  role: ChatRole
  content: string
}

export interface MindMapOutline {
  id: string
  label: string
  children?: MindMapOutline[]
}

export type MindMapOp =
  | { op: 'add'; parentId: string; label: string }
  | { op: 'update'; id: string; label: string }
  | { op: 'remove'; id: string }

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool-call'; toolName: string; toolCallId: string; input: unknown }
  | { type: 'tool-result'; toolName: string; toolCallId: string; output: unknown }
  | { type: 'mindmap-patch'; ops: MindMapOp[] }
  | { type: 'mindmap-set'; markdown: string }
  | { type: 'step-finish' }
  | { type: 'error'; message: string }

export interface MindMapPlan {
  id: string
  ownerId: string
  status: PlanningStatus
  version: number
  messages: AgentMessage[]
  mindMap?: MindMapOutline
  markdown?: string
  documentId?: string
  metadata: Record<string, string>
  createdAt: string
  updatedAt: string
  error?: string
}

export interface MindMapRun {
  id: string
  planningId: string
  ownerId: string
  status: PlanningStatus
  instruction: string
  baseVersion: number
  startedAt?: string
  completedAt?: string
  retryCount: number
  completedSteps: number
  lastEventType?: string
  error?: string
}

export interface MindMapEvent {
  id: string
  planningId: string
  runId: string
  sequence: number
  type: string
  payload: unknown
  createdAt: string
}

export interface MindMapDocument {
  id: string
  ownerId: string
  upstreamFileName: string
  originalName?: string
  status: 'uploaded' | 'indexing' | 'indexed' | 'failed'
  createdAt: string
  updatedAt: string
  error?: string
}

export interface ExportArtifact {
  planningId: string
  version: number
  format: 'opml' | 'png' | 'markdown'
  mediaType: string
  bytes: number
  dataBase64: string
  createdAt: string
}

export interface AgentRequest {
  messages: AgentMessage[]
  fileName?: string
  mindMap?: MindMapOutline
}

export interface RunAgentOptions {
  request: AgentRequest
  signal: AbortSignal
  onEvent: (event: AgentEvent) => Promise<void> | void
}

export interface UpstreamClient {
  ensureReady(signal?: AbortSignal): Promise<void>
  runAgent(options: RunAgentOptions): Promise<void>
  exportMindMap(options: {
    mindMap: MindMapOutline
    markdown?: string
    formats: Array<'opml' | 'png' | 'markdown'>
    signal?: AbortSignal
  }): Promise<ExportArtifact[]>
  uploadDocument(path: string, displayName?: string, signal?: AbortSignal): Promise<string>
  indexDocument(upstreamFileName: string, signal?: AbortSignal): Promise<void>
}

export interface ConcurrencyConfig {
  maxConcurrentRunsGlobal: number
  maxConcurrentRunsPerOwner: number
  maxConcurrentRunsPerPlanning: 1
  maxConcurrentDocumentIndexes: number
  upstreamRequestTimeoutMs: number
  maxRetries: number
}
