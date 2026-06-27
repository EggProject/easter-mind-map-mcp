import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../src/config'
import { MindMapService } from '../src/service'
import { FileStore } from '../src/store'
import type { RunAgentOptions, UpstreamClient } from '../src/types'

class ResourceUpstream implements UpstreamClient {
  async ensureReady(): Promise<void> {}

  async runAgent(options: RunAgentOptions): Promise<void> {
    await options.onEvent({ type: 'mindmap-set', markdown: '# Root\n## Branch\n- Leaf' })
  }

  async uploadDocument(): Promise<string> {
    return 'doc.pdf'
  }

  async indexDocument(): Promise<void> {}
}

describe('MCP resource reads', () => {
  it('returns plan, events, guide, and export resources by URI', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-resource-'))
    const service = new MindMapService(
      new FileStore(dataDir),
      new ResourceUpstream(),
      loadConfig({ MINDMAP_DATA_DIR: dataDir, MINDMAP_DOCUMENT_ROOTS: dataDir }),
    )
    const created = await service.create({ ownerId: 'local', prompt: 'A' })
    await eventually(async () => {
      const result = await service.getResult('local', created.planningId, 'summary')
      expect(result.status).toBe('completed')
    })
    await service.export('local', created.planningId, ['opml', 'png'])

    expect(
      (await service.readResource('local', `mindmap://plans/${created.planningId}`)).text,
    ).toContain(created.planningId)
    expect(
      (await service.readResource('local', `mindmap://plans/${created.planningId}/events`))
        .mimeType,
    ).toBe('application/x-ndjson')
    expect((await service.readResource('local', 'mindmap://guide')).text).toContain(
      'mindmap_export',
    )
    const png = await service.readResource('local', `mindmap://exports/${created.planningId}/png`)
    expect(png.mimeType).toBe('image/png')
    expect(png.blob).toBeTruthy()
  })
})

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
