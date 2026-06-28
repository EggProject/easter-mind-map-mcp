import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'bun:test'
import { loadConfig } from '../src/config'
import { MindMapService } from '../src/service'
import { MemoryStore } from '../src/store'
import type { ExportArtifact, RunAgentOptions, UpstreamClient } from '../src/types'

class FakeUpstream implements UpstreamClient {
  active = 0
  maxActive = 0
  indexCalls = 0
  exportCalls: Array<Array<'opml' | 'png' | 'markdown'>> = []
  requests: RunAgentOptions['request'][] = []
  fail = false
  failIndex = false
  delayMs = 0
  cleanCloseOnAbort = false

  async ensureReady(): Promise<void> {}

  async runAgent(options: RunAgentOptions): Promise<void> {
    this.requests.push(options.request)
    this.active += 1
    this.maxActive = Math.max(this.maxActive, this.active)
    try {
      if (this.delayMs > 0) await delay(this.delayMs)
      if (this.cleanCloseOnAbort) {
        await new Promise<void>((resolve) =>
          options.signal.addEventListener('abort', () => resolve()),
        )
        return
      }
      if (this.fail) {
        await options.onEvent({ type: 'mindmap-set', markdown: '# Broken' })
        throw new Error('upstream boom')
      }
      await options.onEvent({ type: 'mindmap-set', markdown: '# Root\n## Branch\n- Leaf' })
      await options.onEvent({ type: 'step-finish' })
    } finally {
      this.active -= 1
    }
  }

  async uploadDocument(): Promise<string> {
    return 'uploaded.pdf'
  }

  async exportMindMap(options: {
    formats: Array<'opml' | 'png' | 'markdown'>
  }): Promise<ExportArtifact[]> {
    this.exportCalls.push(options.formats)
    return options.formats.map((format) => fakeArtifact(format))
  }

  async indexDocument(): Promise<void> {
    this.indexCalls += 1
    await delay(20)
    if (this.failIndex) throw new Error('index boom')
  }
}

describe('mind map service', () => {
  it('creates in-memory ids and commits completed output', async () => {
    const { service } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'Plan Easter' })
    expect(created.planningId).toStartWith('plan_')
    await eventually(async () => {
      const result = await service.getResult('u1', created.planningId, 'outline')
      expect(result.status).toBe('completed')
    })
  })

  it('deduplicates idempotent create calls', async () => {
    const { service } = await makeService()
    const first = await service.create({ ownerId: 'u1', prompt: 'A', idempotencyKey: 'same' })
    const second = await service.create({ ownerId: 'u1', prompt: 'A', idempotencyKey: 'same' })
    expect(second.planningId).toBe(first.planningId)
    expect(second.runId).toBe(first.runId)
  })

  it('keeps plan ownership isolated', async () => {
    const { service } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await expect(service.getStatus('u2', created.planningId)).rejects.toThrow()
  })

  it('resource-links OPML and PNG exports', async () => {
    const { service, upstream } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    let exported: Record<string, unknown> = {}
    await eventually(async () => {
      exported = await service.export('u1', created.planningId, ['markdown', 'opml', 'png'])
      expect(JSON.stringify(exported)).toContain('mindmap://exports/')
    })
    expect(JSON.stringify(exported)).toContain(`mindmap://exports/${created.planningId}/1/png`)
    expect(upstream.exportCalls).toEqual([])
    await service.readResource('u1', `mindmap://exports/${created.planningId}/1/png`)
    expect(upstream.exportCalls).toEqual([['png']])
  })

  it('settles upstream runs without leaked active streams', async () => {
    const { service, upstream } = await makeService()
    await Promise.all([
      service.create({ ownerId: 'u1', prompt: 'A' }),
      service.create({ ownerId: 'u1', prompt: 'B' }),
      service.create({ ownerId: 'u1', prompt: 'C' }),
    ])
    await eventually(async () => expect(service.queueSnapshot().active).toBe(0))
    expect(upstream.active).toBe(0)
    expect(upstream.maxActive).toBeLessThanOrEqual(2)
  })

  it('does not recover runs after restart because runtime state is memory-only', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-recover-'))
    const service = new MindMapService(new MemoryStore(), new FakeUpstream(), makeConfig(dataDir))
    expect(await service.recoverPendingRuns()).toBe(0)
    await expect(service.getResult('u1', 'plan_restart', 'summary')).rejects.toThrow()
  })

  it('serializes continuations for the same plan while allowing different plans', async () => {
    const { service, upstream } = await makeService()
    upstream.delayMs = 25
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('completed'),
    )
    await Promise.all([
      service.continue({ ownerId: 'u1', planningId: created.planningId, instruction: 'B' }),
      service.continue({ ownerId: 'u1', planningId: created.planningId, instruction: 'C' }),
    ])
    await eventually(() => expect(service.queueSnapshot().active).toBe(0))
    expect(upstream.maxActive).toBeLessThanOrEqual(1)
  })

  it('keeps events isolated per plan', async () => {
    const { service } = await makeService()
    const first = await service.create({ ownerId: 'u1', prompt: 'A' })
    const second = await service.create({ ownerId: 'u1', prompt: 'B' })
    await eventually(async () => {
      expect((await service.getStatus('u1', first.planningId)).status).toBe('completed')
      expect((await service.getStatus('u1', second.planningId)).status).toBe('completed')
    })
    const firstEvents = await service.readResource(
      'u1',
      `mindmap://plans/${first.planningId}/events`,
    )
    const secondEvents = await service.readResource(
      'u1',
      `mindmap://plans/${second.planningId}/events`,
    )
    expect(firstEvents.text).toContain(first.planningId)
    expect(firstEvents.text).not.toContain(second.planningId)
    expect(secondEvents.text).toContain(second.planningId)
  })

  it('lists plans for one owner with resource URIs', async () => {
    const { service } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await service.create({ ownerId: 'u2', prompt: 'B' })

    const plans = await service.list('u1')
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatchObject({
      planningId: created.planningId,
      resourceUri: `mindmap://plans/${created.planningId}`,
    })
  })

  it('summarizes plans without a committed mind map', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-summary-'))
    const store = new MemoryStore()
    const now = new Date().toISOString()
    await store.savePlan({
      id: 'plan_empty',
      ownerId: 'u1',
      status: 'queued',
      version: 0,
      messages: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    })
    const service = new MindMapService(store, new FakeUpstream(), makeConfig(dataDir))

    expect((await service.getResult('u1', 'plan_empty', 'summary')).summary).toBe(
      'queued plan version 0; 0 mind-map node(s).',
    )
  })

  it('does not commit failed partial run snapshots over the last completed version', async () => {
    const { service, upstream } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('completed'),
    )
    const before = await service.getResult('u1', created.planningId, 'outline')
    upstream.fail = true
    await service.continue({ ownerId: 'u1', planningId: created.planningId, instruction: 'Break' })
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('failed'),
    )
    const after = await service.getResult('u1', created.planningId, 'outline')
    expect(after.version).toBe(before.version)
    expect(after.mindMap).toEqual(before.mindMap)
  })

  it('does not commit a cancelled run when upstream closes cleanly after abort', async () => {
    const { service, upstream } = await makeService()
    upstream.cleanCloseOnAbort = true
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('running'),
    )
    await service.cancel('u1', created.planningId)
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('cancelled'),
    )
  })

  it('continues with previous messages and current mind map', async () => {
    const { service, upstream } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('completed'),
    )
    await service.continue({ ownerId: 'u1', planningId: created.planningId, instruction: 'Refine' })
    await eventually(async () =>
      expect((await service.getStatus('u1', created.planningId)).status).toBe('completed'),
    )
    const request = upstream.requests.at(-1)
    expect(request?.messages.map((message) => message.content)).toContain('A')
    expect(request?.messages.map((message) => message.content)).toContain('Refine')
    expect(request?.mindMap?.label).toBe('Root')
  })

  it('deduplicates concurrent indexing for the same document', async () => {
    const { service, upstream, dataDir } = await makeService()
    const added = await service.documentAdd({
      ownerId: 'u1',
      source: { type: 'local_path', path: join(dataDir, 'a.pdf') },
    })
    await Promise.all([
      service.documentIndex('u1', added.documentId),
      service.documentIndex('u1', added.documentId),
    ])
    expect(upstream.indexCalls).toBe(1)
  })

  it('rejects unindexed documents during creation and reports indexing failures', async () => {
    const { service, upstream, dataDir } = await makeService()
    const added = await service.documentAdd({
      ownerId: 'u1',
      source: { type: 'local_path', path: join(dataDir, 'a.pdf') },
    })

    await expect(
      service.create({ ownerId: 'u1', prompt: 'Use doc', documentId: added.documentId }),
    ).rejects.toThrow('document must be indexed')

    upstream.failIndex = true
    await expect(service.documentIndex('u1', added.documentId)).rejects.toThrow('index boom')
    expect(
      (await service.documentIndex('u1', added.documentId).catch((error) => error)).message,
    ).toBe('index boom')
  })

  it('returns indexed immediately for an already indexed document', async () => {
    const { service, dataDir } = await makeService()
    const added = await service.documentAdd({
      ownerId: 'u1',
      source: { type: 'local_path', path: join(dataDir, 'a.pdf') },
    })
    await service.documentIndex('u1', added.documentId)

    expect(await service.documentIndex('u1', added.documentId)).toEqual({
      documentId: added.documentId,
      status: 'indexed',
    })
  })
})

async function makeService(): Promise<{
  service: MindMapService
  upstream: FakeUpstream
  dataDir: string
}> {
  const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-mcp-'))
  const upstream = new FakeUpstream()
  const config = makeConfig(dataDir)
  return {
    service: new MindMapService(new MemoryStore(), upstream, config),
    upstream,
    dataDir,
  }
}

function fakeArtifact(format: 'opml' | 'png' | 'markdown'): ExportArtifact {
  const text = format === 'png' ? 'png-bytes' : `${format}-text`
  return {
    planningId: 'upstream-plan',
    version: 1,
    format,
    mediaType: format === 'png' ? 'image/png' : format === 'opml' ? 'text/x-opml' : 'text/markdown',
    bytes: new TextEncoder().encode(text).byteLength,
    dataBase64: Buffer.from(text).toString('base64'),
    createdAt: new Date().toISOString(),
  }
}

function makeConfig(dataDir: string) {
  return loadConfig({
    EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR: dataDir,
    EASTER_MIND_MAP_MCP_MINDMAP_MAX_RUNS_GLOBAL: '2',
    EASTER_MIND_MAP_MCP_MINDMAP_MAX_RUNS_PER_OWNER: '2',
    EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS: dataDir,
  })
}

async function eventually(assertion: () => Promise<void> | void): Promise<void> {
  const started = Date.now()
  let lastError: unknown
  while (Date.now() - started < 1000) {
    try {
      await assertion()
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  throw lastError
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
