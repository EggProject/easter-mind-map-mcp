import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { loadConfig } from '../src/config'
import {
  createDefaultService,
  createMcpServer,
  createStdioTransport,
  registerResources,
  registerTools,
  startStdioServer,
} from '../src/mcp/server'
import type { MindMapService } from '../src/service'

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>
type ResourceHandler = (uri: URL) => Promise<unknown>
type ToolRegistrationOptions = {
  description?: string
  inputSchema?: Record<string, { description?: string }>
}

class FakeRuntimeServer {
  connected = false
  readonly tools = new Map<string, ToolHandler>()
  readonly toolOptions = new Map<string, unknown>()
  readonly resources: Array<{ name: string; handler: ResourceHandler }> = []

  registerTool(name: string, options: unknown, handler: any): any {
    this.tools.set(name, handler as ToolHandler)
    this.toolOptions.set(name, options)
    return {}
  }

  registerResource(name: string, _uriOrTemplate: unknown, _metadata: unknown, handler: any): any {
    this.resources.push({ name, handler: handler as ResourceHandler })
    return {}
  }

  async connect(): Promise<void> {
    this.connected = true
  }
}

class FakeService {
  recovered = false

  async recoverPendingRuns(): Promise<number> {
    this.recovered = true
    return 0
  }

  async create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { tool: 'create', input }
  }

  async continue(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { tool: 'continue', input }
  }

  async getStatus(ownerId: string, planningId: string): Promise<Record<string, unknown>> {
    return { tool: 'status', ownerId, planningId }
  }

  async getResult(
    ownerId: string,
    planningId: string,
    format?: string,
  ): Promise<Record<string, unknown>> {
    return { tool: 'result', ownerId, planningId, format }
  }

  async cancel(ownerId: string, planningId: string): Promise<Record<string, unknown>> {
    return { tool: 'cancel', ownerId, planningId }
  }

  async list(ownerId: string): Promise<Array<Record<string, unknown>>> {
    return [{ tool: 'list', ownerId }]
  }

  async documentAdd(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { tool: 'documentAdd', input }
  }

  async documentIndex(ownerId: string, documentId: string): Promise<Record<string, unknown>> {
    return { tool: 'documentIndex', ownerId, documentId }
  }

  async export(
    _ownerId: string,
    planningId: string,
    formats?: Array<'opml' | 'png' | 'markdown'>,
  ): Promise<Record<string, unknown>> {
    return {
      planningId,
      formats,
      version: 1,
      artifacts: [
        { format: 'opml', resourceUri: `mindmap://exports/${planningId}/1/opml`, bytes: 10 },
        { format: 'png', resourceUri: `mindmap://exports/${planningId}/1/png`, bytes: 20 },
        {
          format: 'markdown',
          resourceUri: `mindmap://exports/${planningId}/1/markdown`,
          bytes: 30,
        },
      ],
    }
  }

  async guide(): Promise<string> {
    return 'guide'
  }

  async readResource(
    _ownerId: string,
    uri: string,
  ): Promise<{ uri: string; mimeType: string; text?: string; blob?: string }> {
    if (uri.includes('/exports/')) return { uri, mimeType: 'image/png', blob: 'AAAA' }
    if (uri.includes('/outline')) return { uri, mimeType: 'application/json' }
    return { uri, mimeType: 'text/plain', text: 'resource text' }
  }
}

describe('MCP server registration', () => {
  it('starts with injected runtime components and dispatches every tool handler', async () => {
    const fakeServer = new FakeRuntimeServer()
    const fakeService = new FakeService()
    await startStdioServer({
      config: makeConfig(await mkdtemp(join(tmpdir(), 'mindmap-mcp-register-'))),
      service: fakeService as unknown as MindMapService,
      server: fakeServer,
      transport: {} as never,
    })

    expect(fakeService.recovered).toBe(true)
    expect(fakeServer.connected).toBe(true)
    expect([...fakeServer.tools.keys()].sort()).toEqual([
      'mindmap_cancel',
      'mindmap_continue',
      'mindmap_create',
      'mindmap_document_add',
      'mindmap_document_index',
      'mindmap_export',
      'mindmap_get_result',
      'mindmap_get_status',
      'mindmap_guide',
      'mindmap_list',
    ])

    expect(await textTool(fakeServer, 'mindmap_create', { prompt: 'A' })).toContain(
      '"tool": "create"',
    )
    expect(
      await textTool(fakeServer, 'mindmap_continue', { planningId: 'p1', instruction: 'B' }),
    ).toContain('"tool": "continue"')
    expect(await textTool(fakeServer, 'mindmap_get_status', { planningId: 'p1' })).toContain(
      '"tool": "status"',
    )
    expect(
      await textTool(fakeServer, 'mindmap_get_result', { planningId: 'p1', format: 'markdown' }),
    ).toContain('"tool": "result"')
    expect(await textTool(fakeServer, 'mindmap_cancel', { planningId: 'p1' })).toContain(
      '"tool": "cancel"',
    )
    expect(await textTool(fakeServer, 'mindmap_list', {})).toContain('"tool": "list"')
    expect(
      await textTool(fakeServer, 'mindmap_document_add', {
        source: { type: 'local_path', path: '/tmp/a.pdf' },
      }),
    ).toContain('"tool": "documentAdd"')
    expect(await textTool(fakeServer, 'mindmap_document_index', { documentId: 'd1' })).toContain(
      '"tool": "documentIndex"',
    )
    const exported = await fakeServer.tools.get('mindmap_export')?.({
      planningId: 'p1',
      formats: ['markdown'],
    })
    expect(JSON.stringify(exported)).toContain('text/markdown')
    expect(JSON.stringify(await fakeServer.tools.get('mindmap_guide')?.({}))).toContain('guide')
  })

  it('registers resources and adapts text, empty text, and blob payloads', async () => {
    const fakeServer = new FakeRuntimeServer()
    registerResources(fakeServer, new FakeService() as unknown as MindMapService)

    expect(fakeServer.resources.map((resource) => resource.name)).toEqual([
      'mindmap_guide',
      'mindmap_plan',
      'mindmap_plan_outline',
      'mindmap_plan_markdown',
      'mindmap_plan_events',
      'mindmap_export',
    ])
    expect(await fakeServer.resources[0].handler(new URL('mindmap://guide'))).toEqual({
      contents: [{ uri: 'mindmap://guide', mimeType: 'text/plain', text: 'resource text' }],
    })
    expect(await fakeServer.resources[2].handler(new URL('mindmap://plans/p1/outline'))).toEqual({
      contents: [{ uri: 'mindmap://plans/p1/outline', mimeType: 'application/json', text: '' }],
    })
    expect(await fakeServer.resources[5].handler(new URL('mindmap://exports/p1/1/png'))).toEqual({
      contents: [{ uri: 'mindmap://exports/p1/1/png', mimeType: 'image/png', blob: 'AAAA' }],
    })
  })

  it('builds default server components without connecting them', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-mcp-defaults-'))
    const config = makeConfig(dataDir)
    const service = createDefaultService(config)
    const runtimeServer = createMcpServer()
    const transport = createStdioTransport()

    expect(service.queueSnapshot()).toEqual({ active: 0, pending: 0, activePlans: [] })
    expect(runtimeServer).toBeDefined()
    expect(transport).toBeDefined()
  })

  it('can register tools directly', () => {
    const fakeServer = new FakeRuntimeServer()
    registerTools(fakeServer, new FakeService() as unknown as MindMapService)
    expect(fakeServer.tools.size).toBe(10)
    const createOptions = fakeServer.toolOptions.get('mindmap_create') as ToolRegistrationOptions
    expect(createOptions.description).toContain('Next action')
    expect(createOptions.inputSchema?.prompt.description).toContain('Required')
    expect(createOptions.inputSchema?.prompt.description).toContain('user goal')
    expect(createOptions.inputSchema?.documentId.description).toContain('mindmap_document_index')
    const statusOptions = fakeServer.toolOptions.get(
      'mindmap_get_status',
    ) as ToolRegistrationOptions
    expect(statusOptions.inputSchema?.planningId.description).toContain('Do not substitute runId')
    const documentAddOptions = fakeServer.toolOptions.get(
      'mindmap_document_add',
    ) as ToolRegistrationOptions
    expect(documentAddOptions.inputSchema?.source.description).toContain('Local PDF')
    const exportOptions = fakeServer.toolOptions.get('mindmap_export') as ToolRegistrationOptions
    expect(exportOptions.inputSchema?.formats.description).toContain('["opml","png"]')
  })
})

async function textTool(
  server: FakeRuntimeServer,
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  const result = (await server.tools.get(name)?.(input)) as { content: Array<{ text: string }> }
  return result.content[0].text
}

function makeConfig(dataDir: string) {
  return loadConfig({
    EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR: dataDir,
    EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS: dataDir,
    EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL: 'http://upstream.test',
  })
}
