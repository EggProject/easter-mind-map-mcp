import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { assertAllowedLocalPdf, ValidationError } from '../src/security'
import { MemoryStore } from '../src/store'

describe('store and security edges', () => {
  it('lists all plans and owner-filtered plans from memory state', async () => {
    const store = new MemoryStore()
    const now = new Date().toISOString()
    await store.savePlan({
      id: 'p1',
      ownerId: 'u1',
      status: 'queued',
      version: 0,
      messages: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    })
    await store.savePlan({
      id: 'p2',
      ownerId: 'u2',
      status: 'completed',
      version: 1,
      messages: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    })

    expect((await store.listAllPlans()).map((plan) => plan.id).sort()).toEqual(['p1', 'p2'])
    expect((await store.listPlans('u1')).map((plan) => plan.id)).toEqual(['p1'])
  })

  it('stores runs, events, documents, and idempotency in memory', async () => {
    const store = new MemoryStore()
    const now = new Date().toISOString()
    await store.saveRun({
      id: 'r1',
      planningId: 'p1',
      ownerId: 'u1',
      status: 'queued',
      instruction: 'A',
      baseVersion: 0,
      retryCount: 0,
      completedSteps: 0,
    })
    await store.appendEvent({
      id: 'e1',
      planningId: 'p1',
      runId: 'r1',
      sequence: 1,
      type: 'text',
      payload: { type: 'text', text: 'hello' },
      createdAt: now,
    })
    await store.saveDocument({
      id: 'd1',
      ownerId: 'u1',
      upstreamFileName: 'doc.pdf',
      status: 'uploaded',
      createdAt: now,
      updatedAt: now,
    })
    await store.saveIdempotency('u1', 'same', { planningId: 'p1', runId: 'r1' })

    expect((await store.getRun('r1'))?.planningId).toBe('p1')
    expect(await store.listRuns('p1')).toHaveLength(1)
    expect(await store.listEvents('p1')).toHaveLength(1)
    expect((await store.getDocument('d1'))?.upstreamFileName).toBe('doc.pdf')
    expect(await store.getIdempotency('u1', 'same')).toEqual({ planningId: 'p1', runId: 'r1' })
  })

  it('rejects local documents outside allowed roots or without a pdf suffix', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-doc-root-'))

    expect(() => assertAllowedLocalPdf(join(dataDir, 'notes.txt'), [dataDir])).toThrow(
      ValidationError,
    )
    expect(() => assertAllowedLocalPdf(join(tmpdir(), 'outside.pdf'), [dataDir])).toThrow(
      ValidationError,
    )
    expect(assertAllowedLocalPdf(join(dataDir, 'inside.pdf'), [dataDir])).toEndWith('inside.pdf')
  })
})
