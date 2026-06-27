import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { assertAllowedLocalPdf, ValidationError } from '../src/security'
import { FileStore } from '../src/store'

describe('store and security edges', () => {
  it('lists all plans and owner-filtered plans from persisted state', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-store-'))
    const store = new FileStore(dataDir)
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
