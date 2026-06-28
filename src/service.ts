import { newId, nowIso } from './ids'
import { cloneOutline, reduceAgentEvent } from './mindmap'
import type { ReducedRun } from './mindmap'
import { RunQueue } from './queue'
import { assertAllowedLocalPdf, assertDocumentOwner, assertPlanOwner } from './security'
import type { ServerConfig } from './config'
import type { Store } from './store'
import type {
  AgentEvent,
  AgentMessage,
  MindMapDocument,
  MindMapPlan,
  MindMapRun,
  MindMapOutline,
  UpstreamClient,
} from './types'

export class MindMapService {
  private readonly queue: RunQueue
  private readonly documentLocks = new Set<string>()
  private readonly exportSnapshots = new Map<
    string,
    { planningId: string; version: number; mindMap: MindMapOutline; markdown?: string }
  >()

  constructor(
    private readonly store: Store,
    private readonly upstream: UpstreamClient,
    private readonly config: ServerConfig,
  ) {
    this.queue = new RunQueue(config.concurrency)
  }

  async create(input: {
    ownerId: string
    prompt: string
    documentId?: string
    initialMindMap?: MindMapOutline
    idempotencyKey?: string
    metadata?: Record<string, string>
  }): Promise<{
    planningId: string
    runId: string
    status: 'queued' | 'running'
    resourceUri: string
    nextAction: string
  }> {
    if (input.idempotencyKey) {
      const existing = await this.store.getIdempotency(input.ownerId, input.idempotencyKey)
      if (existing) {
        const run = await this.store.getRun(existing.runId)
        return {
          planningId: existing.planningId,
          runId: existing.runId,
          status: run?.status === 'running' ? 'running' : 'queued',
          resourceUri: planUri(existing.planningId),
          nextAction: 'call mindmap_get_status with this planningId',
        }
      }
    }
    if (input.documentId) {
      const document = assertDocumentOwner(
        await this.store.getDocument(input.documentId),
        input.ownerId,
      )
      if (document.status !== 'indexed')
        throw new Error('document must be indexed before it can be used for generation')
    }
    const planningId = newId('plan')
    const runId = newId('run')
    const createdAt = nowIso()
    const plan: MindMapPlan = {
      id: planningId,
      ownerId: input.ownerId,
      status: 'queued',
      version: 0,
      messages: [{ role: 'user', content: input.prompt }],
      mindMap: input.initialMindMap ? cloneOutline(input.initialMindMap) : undefined,
      documentId: input.documentId,
      metadata: input.metadata ?? {},
      createdAt,
      updatedAt: createdAt,
    }
    const run: MindMapRun = {
      id: runId,
      planningId,
      ownerId: input.ownerId,
      status: 'queued',
      instruction: input.prompt,
      baseVersion: 0,
      retryCount: 0,
      completedSteps: 0,
    }
    await this.store.savePlan(plan)
    await this.store.saveRun(run)
    if (input.idempotencyKey)
      await this.store.saveIdempotency(input.ownerId, input.idempotencyKey, { planningId, runId })
    this.queue.enqueue({
      ownerId: input.ownerId,
      planningId,
      runId,
      execute: (signal) => this.executeRun(runId, signal),
    })
    return {
      planningId,
      runId,
      status: 'queued',
      resourceUri: planUri(planningId),
      nextAction: 'call mindmap_get_status with this planningId',
    }
  }

  async continue(input: {
    ownerId: string
    planningId: string
    instruction: string
    idempotencyKey?: string
  }): Promise<{ planningId: string; runId: string; status: 'queued' | 'running' }> {
    const plan = assertPlanOwner(await this.store.getPlan(input.planningId), input.ownerId)
    if (input.idempotencyKey) {
      const existing = await this.store.getIdempotency(input.ownerId, input.idempotencyKey)
      if (existing)
        return { planningId: existing.planningId, runId: existing.runId, status: 'queued' }
    }
    const runId = newId('run')
    const run: MindMapRun = {
      id: runId,
      planningId: plan.id,
      ownerId: input.ownerId,
      status: 'queued',
      instruction: input.instruction,
      baseVersion: plan.version,
      retryCount: 0,
      completedSteps: 0,
    }
    const updatedPlan: MindMapPlan = {
      ...plan,
      status: 'queued',
      updatedAt: nowIso(),
      error: undefined,
    }
    await this.store.savePlan(updatedPlan)
    await this.store.saveRun(run)
    if (input.idempotencyKey)
      await this.store.saveIdempotency(input.ownerId, input.idempotencyKey, {
        planningId: plan.id,
        runId,
      })
    this.queue.enqueue({
      ownerId: input.ownerId,
      planningId: plan.id,
      runId,
      execute: (signal) => this.executeRun(runId, signal),
    })
    return { planningId: plan.id, runId, status: 'queued' }
  }

  async getStatus(ownerId: string, planningId: string): Promise<Record<string, unknown>> {
    const plan = assertPlanOwner(await this.store.getPlan(planningId), ownerId)
    const runs = await this.store.listEvents(planningId)
    return {
      planningId,
      status: plan.status,
      progress: {
        completedSteps: runs.filter((event) => event.type === 'step-finish').length,
        lastEventType: runs.at(-1)?.type,
      },
      updatedAt: plan.updatedAt,
      error: plan.error,
      resultResourceUri: plan.status === 'completed' ? `${planUri(planningId)}/outline` : undefined,
    }
  }

  async getResult(
    ownerId: string,
    planningId: string,
    format: 'outline' | 'markdown' | 'summary' = 'summary',
  ): Promise<Record<string, unknown>> {
    const plan = assertPlanOwner(await this.store.getPlan(planningId), ownerId)
    return {
      planningId,
      status: plan.status,
      version: plan.version,
      mindMap: format === 'outline' ? plan.mindMap : undefined,
      markdown: format === 'markdown' ? plan.markdown : undefined,
      summary: format === 'summary' ? summarize(plan) : undefined,
      resourceUri: `${planUri(planningId)}/${format === 'markdown' ? 'markdown' : 'outline'}`,
    }
  }

  async cancel(
    ownerId: string,
    planningId: string,
  ): Promise<{ planningId: string; status: 'cancelled' }> {
    const plan = assertPlanOwner(await this.store.getPlan(planningId), ownerId)
    const cancellableRuns = (await this.store.listRuns(planningId)).filter((run) =>
      ['queued', 'running'].includes(run.status),
    )
    for (const run of cancellableRuns) {
      this.queue.cancel(run.id)
      await this.store.saveRun({ ...run, status: 'cancelled', completedAt: nowIso() })
    }
    await this.store.savePlan({ ...plan, status: 'cancelled', updatedAt: nowIso() })
    return { planningId, status: 'cancelled' }
  }

  async list(ownerId: string): Promise<Array<Record<string, unknown>>> {
    return (await this.store.listPlans(ownerId)).map((plan) => ({
      planningId: plan.id,
      status: plan.status,
      version: plan.version,
      updatedAt: plan.updatedAt,
      resourceUri: planUri(plan.id),
    }))
  }

  async recoverPendingRuns(): Promise<number> {
    return 0
  }

  async documentAdd(input: {
    ownerId: string
    source: { type: 'local_path'; path: string }
    displayName?: string
  }): Promise<{ documentId: string; upstreamFileName: string; status: 'uploaded' }> {
    const path = assertAllowedLocalPdf(input.source.path, this.config.allowedDocumentRoots)
    const upstreamFileName = await this.upstream.uploadDocument(path, input.displayName)
    const documentId = newId('doc')
    const now = nowIso()
    const document: MindMapDocument = {
      id: documentId,
      ownerId: input.ownerId,
      upstreamFileName,
      originalName: input.displayName,
      status: 'uploaded',
      createdAt: now,
      updatedAt: now,
    }
    await this.store.saveDocument(document)
    return { documentId, upstreamFileName, status: 'uploaded' }
  }

  async documentIndex(
    ownerId: string,
    documentId: string,
  ): Promise<{ documentId: string; status: string }> {
    const document = assertDocumentOwner(await this.store.getDocument(documentId), ownerId)
    if (this.documentLocks.has(documentId)) return { documentId, status: 'indexing' }
    if (document.status === 'indexed') return { documentId, status: 'indexed' }
    this.documentLocks.add(documentId)
    await this.store.saveDocument({ ...document, status: 'indexing', updatedAt: nowIso() })
    try {
      await this.upstream.indexDocument(document.upstreamFileName)
      await this.store.saveDocument({ ...document, status: 'indexed', updatedAt: nowIso() })
      return { documentId, status: 'indexed' }
    } catch (error) {
      await this.store.saveDocument({
        ...document,
        status: 'failed',
        updatedAt: nowIso(),
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    } finally {
      this.documentLocks.delete(documentId)
    }
  }

  async export(
    ownerId: string,
    planningId: string,
    formats: Array<'opml' | 'png' | 'markdown'> = ['opml', 'png'],
  ): Promise<Record<string, unknown>> {
    const plan = assertPlanOwner(await this.store.getPlan(planningId), ownerId)
    if (!plan.mindMap) throw new Error('plan has no mind map to export')
    this.exportSnapshots.set(exportSnapshotKey(planningId, plan.version), {
      planningId,
      version: plan.version,
      mindMap: cloneOutline(plan.mindMap),
      markdown: plan.markdown,
    })
    const artifacts = []
    for (const format of formats) {
      artifacts.push({
        format,
        resourceUri: `mindmap://exports/${planningId}/${plan.version}/${format}`,
      })
    }
    return { planningId, version: plan.version, artifacts }
  }

  async guide(): Promise<string> {
    return GUIDE
  }

  async readResource(
    ownerId: string,
    uri: string,
  ): Promise<{ uri: string; mimeType: string; text?: string; blob?: string }> {
    const parsed = parseMindmapUri(uri)
    if (!parsed) throw new Error(`Unsupported resource URI: ${uri}`)
    if (parsed.kind === 'guide') return { uri, mimeType: 'text/markdown', text: GUIDE }
    if (parsed.kind === 'export') {
      assertPlanOwner(await this.store.getPlan(parsed.planningId), ownerId)
      const snapshot = this.exportSnapshots.get(
        exportSnapshotKey(parsed.planningId, parsed.version),
      )
      if (!snapshot) throw new Error('export snapshot not found; call mindmap_export first')
      await this.upstream.ensureReady()
      const [artifact] = await this.upstream.exportMindMap({
        mindMap: snapshot.mindMap,
        markdown: snapshot.markdown,
        formats: [parsed.format],
      })
      if (!artifact?.dataBase64)
        throw new Error(`upstream export response missing ${parsed.format}`)
      return { uri, mimeType: artifact.mediaType, blob: artifact.dataBase64 }
    }
    const plan = assertPlanOwner(await this.store.getPlan(parsed.planningId), ownerId)
    if (parsed.kind === 'plan')
      return { uri, mimeType: 'application/json', text: JSON.stringify(plan, null, 2) }
    if (parsed.kind === 'outline')
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(plan.mindMap ?? null, null, 2),
      }
    if (parsed.kind === 'markdown')
      return { uri, mimeType: 'text/markdown', text: plan.markdown ?? '' }
    const events = await this.store.listEvents(parsed.planningId)
    return {
      uri,
      mimeType: 'application/x-ndjson',
      text: events.map((event) => JSON.stringify(event)).join('\n'),
    }
  }

  queueSnapshot(): { active: number; pending: number; activePlans: string[] } {
    return this.queue.snapshot()
  }

  private async executeRun(runId: string, signal: AbortSignal): Promise<void> {
    const run = await this.store.getRun(runId)
    if (!run) return
    const plan = await this.store.getPlan(run.planningId)
    if (!plan) return
    const start = nowIso()
    await this.store.saveRun({ ...run, status: 'running', startedAt: start })
    await this.store.savePlan({ ...plan, status: 'running', updatedAt: start })
    const baseVersion = plan.version
    let sequence = (await this.store.listEvents(plan.id)).length
    let reduced: ReducedRun = {
      mindMap: plan.mindMap ? cloneOutline(plan.mindMap) : undefined,
      markdown: plan.markdown,
      assistantText: '',
      completedSteps: 0,
    }
    try {
      await this.upstream.ensureReady(signal)
      const document = plan.documentId ? await this.store.getDocument(plan.documentId) : undefined
      const requestMessages = messagesForRun(plan, run)
      await this.upstream.runAgent({
        request: {
          messages: requestMessages,
          fileName: document?.upstreamFileName,
          mindMap: plan.mindMap,
        },
        signal,
        onEvent: async (event: AgentEvent) => {
          sequence += 1
          await this.store.appendEvent({
            id: newId('evt'),
            planningId: plan.id,
            runId,
            sequence,
            type: event.type,
            payload: event,
            createdAt: nowIso(),
          })
          reduced = reduceAgentEvent(reduced, event)
          if (reduced.failedMessage) throw new Error(reduced.failedMessage)
        },
      })
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const current = await this.store.getPlan(plan.id)
      if (!current || current.version !== baseVersion)
        throw new Error('plan version conflict; refusing to overwrite newer committed state')
      const messages: AgentMessage[] = reduced.assistantText.trim()
        ? [...requestMessages, { role: 'assistant', content: reduced.assistantText }]
        : requestMessages
      const completedAt = nowIso()
      await this.store.savePlan({
        ...current,
        status: 'completed',
        version: current.version + 1,
        messages,
        mindMap: reduced.mindMap,
        markdown: reduced.markdown,
        updatedAt: completedAt,
        error: undefined,
      })
      await this.store.saveRun({
        ...run,
        status: 'completed',
        startedAt: start,
        completedAt,
        completedSteps: reduced.completedSteps,
        lastEventType: reduced.lastEventType,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const status = signal.aborted ? 'cancelled' : 'failed'
      await this.store.saveRun({
        ...run,
        status,
        startedAt: start,
        completedAt: nowIso(),
        error: message,
        completedSteps: reduced.completedSteps,
        lastEventType: reduced.lastEventType,
      })
      const current = await this.store.getPlan(plan.id)
      if (current) {
        await this.store.savePlan({
          ...current,
          status,
          updatedAt: nowIso(),
          error: message,
        })
      }
    }
  }
}

function summarize(plan: MindMapPlan): string {
  const nodeCount = countNodes(plan.mindMap)
  return `${plan.status} plan version ${plan.version}; ${nodeCount} mind-map node(s).`
}

function messagesForRun(plan: MindMapPlan, run: MindMapRun): AgentMessage[] {
  const lastMessage = plan.messages.at(-1)
  if (
    run.baseVersion === 0 &&
    lastMessage?.role === 'user' &&
    lastMessage.content === run.instruction
  )
    return plan.messages
  return [...plan.messages, { role: 'user', content: run.instruction }]
}

function countNodes(node: MindMapOutline | undefined): number {
  if (!node) return 0
  return 1 + (node.children ?? []).reduce((sum, child) => sum + countNodes(child), 0)
}

function planUri(planningId: string): string {
  return `mindmap://plans/${planningId}`
}

type ParsedResource =
  | { kind: 'guide' }
  | { kind: 'plan' | 'outline' | 'markdown' | 'events'; planningId: string }
  | { kind: 'export'; planningId: string; version: number; format: 'opml' | 'png' | 'markdown' }

function parseMindmapUri(uri: string): ParsedResource | null {
  if (uri === 'mindmap://guide') return { kind: 'guide' }
  const planMatch = /^mindmap:\/\/plans\/([^/]+)(?:\/(outline|markdown|events))?$/u.exec(uri)
  if (planMatch) {
    return {
      kind: (planMatch[2] ?? 'plan') as 'plan' | 'outline' | 'markdown' | 'events',
      planningId: planMatch[1],
    }
  }
  const exportMatch = /^mindmap:\/\/exports\/([^/]+)\/(\d+)\/(opml|png|markdown)$/u.exec(uri)
  if (exportMatch) {
    return {
      kind: 'export',
      planningId: exportMatch[1],
      version: Number(exportMatch[2]),
      format: exportMatch[3] as 'opml' | 'png' | 'markdown',
    }
  }
  return null
}

function exportSnapshotKey(planningId: string, version: number): string {
  return `${planningId}/${version}`
}

export const GUIDE = [
  '1) Call mindmap_create(prompt[, documentId]) to start a new in-memory plan, then preserve the returned planningId exactly.',
  '2) Repeat mindmap_get_status(planningId) until status is completed or failed.',
  '3) To refine an existing map, call mindmap_continue(planningId, instruction), then return to step 2.',
  "4) Call mindmap_get_result(planningId, format:'outline'|'markdown') only when the current or final map is needed.",
  "5) REQUIRED FINISH: call mindmap_export(planningId, formats:['opml','png']).",
  'Rule: never invent or alter planningId, runId, or documentId values.',
].join('\n')
