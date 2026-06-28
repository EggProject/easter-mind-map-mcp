import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../src/config'
import { MindMapService } from '../src/service'
import { MemoryStore } from '../src/store'
import type { ExportArtifact, RunAgentOptions, UpstreamClient } from '../src/types'

class ResourceUpstream implements UpstreamClient {
  exportCalls: Array<Array<'opml' | 'png' | 'markdown'>> = []

  async ensureReady(): Promise<void> {}

  async runAgent(options: RunAgentOptions): Promise<void> {
    await options.onEvent({ type: 'mindmap-set', markdown: '# Root\n## Branch\n- Leaf' })
  }

  async uploadDocument(): Promise<string> {
    return 'doc.pdf'
  }

  async exportMindMap(options: {
    formats: Array<'opml' | 'png' | 'markdown'>
  }): Promise<ExportArtifact[]> {
    this.exportCalls.push(options.formats)
    return options.formats.map((format) => ({
      planningId: 'upstream-plan',
      version: 1,
      format,
      mediaType:
        format === 'png' ? 'image/png' : format === 'opml' ? 'text/x-opml' : 'text/markdown',
      bytes: 4,
      dataBase64: 'AAAA',
      createdAt: new Date().toISOString(),
    }))
  }

  async indexDocument(): Promise<void> {}
}

describe('MCP resource reads', () => {
  it('returns plan, events, guide, and export resources by URI', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-resource-'))
    const upstream = new ResourceUpstream()
    const service = new MindMapService(
      new MemoryStore(),
      upstream,
      loadConfig({
        EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR: dataDir,
        EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS: dataDir,
      }),
    )
    const created = await service.create({ ownerId: 'local', prompt: 'A' })
    await eventually(async () => {
      const result = await service.getResult('local', created.planningId, 'summary')
      expect(result.status).toBe('completed')
    })
    const exported = await service.export('local', created.planningId, ['opml', 'png'])
    expect(upstream.exportCalls).toEqual([])
    const pngUri = (exported.artifacts as Array<{ format: string; resourceUri: string }>).find(
      (artifact) => artifact.format === 'png',
    )?.resourceUri

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
    expect(pngUri).toBe(`mindmap://exports/${created.planningId}/1/png`)
    const png = await service.readResource('local', pngUri!)
    expect(png.mimeType).toBe('image/png')
    expect(png.blob).toBeTruthy()
    expect(upstream.exportCalls).toEqual([['png']])
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
