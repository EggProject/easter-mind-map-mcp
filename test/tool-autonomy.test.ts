import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../src/config'
import { GUIDE } from '../src/service'
import { MindMapService } from '../src/service'
import { toolDescriptions } from '../src/mcp/toolDescriptions'
import { MemoryStore } from '../src/store'
import type { ExportArtifact, RunAgentOptions, UpstreamClient } from '../src/types'

describe('tool autonomy wording', () => {
  it('tells the host the required chain and export finish', () => {
    expect(GUIDE).toContain('mindmap_create')
    expect(GUIDE).toContain('mindmap_get_status')
    expect(GUIDE).toContain('mindmap_get_result')
    expect(GUIDE).toContain("mindmap_export(planningId, formats:['opml','png'])")
  })

  it('each tool description contains use, do-not, and next-action guidance', () => {
    for (const description of Object.values(toolDescriptions)) {
      expect(description.toLowerCase()).toContain('use')
      expect(description.toLowerCase()).toContain('do not')
      expect(description.toLowerCase()).toContain('next action')
    }
  })

  it('simulates an MCP host following the guide through create/status/result/export', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-autonomy-'))
    const service = new MindMapService(
      new MemoryStore(),
      new AutonomyUpstream(),
      loadConfig({
        EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR: dataDir,
        EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS: dataDir,
      }),
    )

    const transcript = await simulateHostFromGuide(service, 'local', 'Plan an Easter project')

    expect(transcript[0]).toBe('mindmap_create')
    expect(
      transcript.filter((tool) => tool === 'mindmap_get_status').length,
    ).toBeGreaterThanOrEqual(1)
    expect(transcript.slice(-2)).toEqual(['mindmap_get_result', 'mindmap_export'])
  })
})

class AutonomyUpstream implements UpstreamClient {
  async ensureReady(): Promise<void> {}

  async runAgent(options: RunAgentOptions): Promise<void> {
    await options.onEvent({ type: 'mindmap-set', markdown: '# Easter\n## Build\n- MCP adapter' })
  }

  async uploadDocument(): Promise<string> {
    return 'doc.pdf'
  }

  async exportMindMap(options: {
    formats: Array<'opml' | 'png' | 'markdown'>
  }): Promise<ExportArtifact[]> {
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

async function simulateHostFromGuide(
  service: MindMapService,
  ownerId: string,
  prompt: string,
): Promise<string[]> {
  const guide = await service.guide()
  const transcript: string[] = []
  if (!guide.includes('mindmap_create')) throw new Error('guide omitted create')
  const created = await service.create({ ownerId, prompt })
  transcript.push('mindmap_create')

  while (true) {
    const status = await service.getStatus(ownerId, created.planningId)
    transcript.push('mindmap_get_status')
    if (status.status === 'completed') break
    if (status.status === 'failed') throw new Error('generation failed')
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  if (!guide.includes('mindmap_get_result')) throw new Error('guide omitted result')
  await service.getResult(ownerId, created.planningId, 'outline')
  transcript.push('mindmap_get_result')

  if (!guide.includes("formats:['opml','png']")) throw new Error('guide omitted required export')
  await service.export(ownerId, created.planningId, ['opml', 'png'])
  transcript.push('mindmap_export')
  return transcript
}
