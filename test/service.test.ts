import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'bun:test'
import { loadConfig } from '../src/config'
import { MindMapService } from '../src/service'
import { FileStore } from '../src/store'
import type { RunAgentOptions, UpstreamClient } from '../src/types'

class FakeUpstream implements UpstreamClient {
  active = 0
  maxActive = 0
  indexCalls = 0
  requests: RunAgentOptions['request'][] = []
  fail = false
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

  async indexDocument(): Promise<void> {
    this.indexCalls += 1
    await delay(20)
  }
}

describe('mind map service', () => {
  it('creates persistent ids and commits completed output', async () => {
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
    const { service } = await makeService()
    const created = await service.create({ ownerId: 'u1', prompt: 'A' })
    await eventually(async () => {
      const exported = await service.export('u1', created.planningId, ['opml', 'png'])
      expect(JSON.stringify(exported)).toContain('mindmap://exports/')
    })
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

  it('recovers queued and running runs after a service restart', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-recover-'))
    const store = new FileStore(dataDir)
    const now = new Date().toISOString()
    await store.savePlan({
      id: 'plan_restart',
      ownerId: 'u1',
      status: 'running',
      version: 0,
      messages: [{ role: 'user', content: 'Recover me' }],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    })
    await store.saveRun({
      id: 'run_restart',
      planningId: 'plan_restart',
      ownerId: 'u1',
      status: 'running',
      instruction: 'Recover me',
      baseVersion: 0,
      startedAt: now,
      retryCount: 0,
      completedSteps: 0,
    })

    const upstream = new FakeUpstream()
    const service = new MindMapService(new FileStore(dataDir), upstream, makeConfig(dataDir))
    expect(await service.recoverPendingRuns()).toBe(1)
    await eventually(async () => {
      const result = await service.getResult('u1', 'plan_restart', 'summary')
      expect(result.status).toBe('completed')
    })
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
    service: new MindMapService(new FileStore(dataDir), upstream, config),
    upstream,
    dataDir,
  }
}

function makeConfig(dataDir: string) {
  return loadConfig({
    MINDMAP_DATA_DIR: dataDir,
    MINDMAP_MAX_RUNS_GLOBAL: '2',
    MINDMAP_MAX_RUNS_PER_OWNER: '2',
    MINDMAP_DOCUMENT_ROOTS: dataDir,
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
