import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { loadConfig } from '../config'
import { createLogger, redactForLog } from '../logger'
import { MemoryStore } from '../store'
import { MindMapService } from '../service'
import { HttpUpstreamClient } from '../upstream/client'
import { toolDescriptions } from './toolDescriptions'
import type { ServerConfig } from '../config'
import type { Logger } from '../logger'
import type { Store } from '../store'
import type { UpstreamClient } from '../types'

type RuntimeServer = Pick<McpServer, 'connect' | 'registerResource' | 'registerTool'>

export interface StdioServerOptions {
  config?: ServerConfig
  service?: MindMapService
  server?: RuntimeServer
  transport?: StdioServerTransport
  logger?: Logger
}

export async function startStdioServer(options: StdioServerOptions = {}): Promise<void> {
  const config = options.config ?? loadConfig()
  const logger = options.logger ?? createLogger(config.logLevel, config.logPath)
  logger.info('mcp server starting', {
    dataDir: config.dataDir,
    logLevel: config.logLevel,
    logPath: config.logPath,
    upstreamBaseUrl: config.upstreamBaseUrl,
  })
  logger.debug('mcp server config', {
    allowedDocumentRoots: config.allowedDocumentRoots,
    concurrency: config.concurrency,
    upstreamEnv: redactForLog(config.upstreamEnv),
    upstreamInstallCheckPath: config.upstreamInstallCheckPath,
    upstreamInstallCommand: config.upstreamInstallCommand,
    upstreamStartCommand: config.upstreamStartCommand,
    upstreamWorkingDirectory: config.upstreamWorkingDirectory,
  })
  const service = options.service ?? createDefaultService(config, logger)
  const server = options.server ?? createMcpServer()
  const recovered = await service.recoverPendingRuns()
  logger.info('pending runs recovered', { recovered })
  registerTools(server, service)
  registerResources(server, service)
  await server.connect(options.transport ?? createStdioTransport())
  logger.info('mcp server connected')
}

export function createDefaultService(config: ServerConfig, logger?: Logger): MindMapService {
  const { store, upstream } = makeDefaultComponents(config, logger)
  return new MindMapService(store, upstream, config)
}

export function createMcpServer(): McpServer {
  return new McpServer(
    {
      name: 'easter-mind-map-mcp',
      version: '0.1.0',
    },
    {
      instructions:
        'This server manages in-memory MindGeniusAI mind-map plans. Always call mindmap_create first, preserve returned IDs exactly, poll with mindmap_get_status, fetch result only when needed, and finish with mindmap_export using opml and png.',
    },
  )
}

export function createStdioTransport(): StdioServerTransport {
  return new StdioServerTransport()
}

export function makeDefaultComponents(
  config: ServerConfig,
  logger?: Logger,
): {
  store: Store
  upstream: UpstreamClient
} {
  return {
    store: new MemoryStore(),
    upstream: new HttpUpstreamClient(
      config.upstreamBaseUrl,
      config.upstreamStartCommand,
      config.upstreamHealthTimeoutMs,
      undefined,
      config.concurrency.upstreamRequestTimeoutMs,
      config.upstreamInstallCommand,
      config.upstreamInstallCheckPath,
      config.upstreamEnv,
      undefined,
      logger,
      config.upstreamWorkingDirectory,
    ),
  }
}

export function registerTools(
  server: Pick<McpServer, 'registerTool'>,
  service: MindMapService,
): void {
  const ownerId = 'local'
  server.registerTool(
    'mindmap_create',
    {
      description: toolDescriptions.mindmap_create,
      inputSchema: {
        prompt: z.string().min(1).describe('The user goal/topic to turn into a mind map.'),
        documentId: z
          .string()
          .optional()
          .describe('Previously uploaded and indexed documentId for RAG.'),
        initialMindMap: z.any().optional().describe('Optional current outline to continue from.'),
        idempotencyKey: z
          .string()
          .optional()
          .describe('Stable caller key that prevents duplicate plans.'),
        metadata: z.record(z.string()).optional().describe('Small caller metadata, not secrets.'),
      },
    },
    async (input) => json(await service.create({ ownerId, ...input })),
  )
  server.registerTool(
    'mindmap_continue',
    {
      description: toolDescriptions.mindmap_continue,
      inputSchema: {
        planningId: z.string().describe('Existing planningId returned by mindmap_create.'),
        instruction: z
          .string()
          .min(1)
          .describe('New refinement instruction for the existing plan.'),
        idempotencyKey: z
          .string()
          .optional()
          .describe('Stable caller key that prevents duplicate runs.'),
      },
    },
    async (input) => json(await service.continue({ ownerId, ...input })),
  )
  server.registerTool(
    'mindmap_get_status',
    {
      description: toolDescriptions.mindmap_get_status,
      inputSchema: {
        planningId: z.string().describe('Existing planningId to poll.'),
      },
    },
    async ({ planningId }) => json(await service.getStatus(ownerId, planningId)),
  )
  server.registerTool(
    'mindmap_get_result',
    {
      description: toolDescriptions.mindmap_get_result,
      inputSchema: {
        planningId: z.string().describe('Existing planningId to read.'),
        format: z
          .enum(['outline', 'markdown', 'summary'])
          .optional()
          .describe('Result representation.'),
      },
    },
    async ({ planningId, format }) => json(await service.getResult(ownerId, planningId, format)),
  )
  server.registerTool(
    'mindmap_cancel',
    {
      description: toolDescriptions.mindmap_cancel,
      inputSchema: {
        planningId: z.string().describe('Existing planningId to cancel.'),
      },
    },
    async ({ planningId }) => json(await service.cancel(ownerId, planningId)),
  )
  server.registerTool(
    'mindmap_list',
    {
      description: toolDescriptions.mindmap_list,
      inputSchema: {},
    },
    async () => json(await service.list(ownerId)),
  )
  server.registerTool(
    'mindmap_document_add',
    {
      description: toolDescriptions.mindmap_document_add,
      inputSchema: {
        source: z.object({ type: z.literal('local_path'), path: z.string() }),
        displayName: z.string().optional(),
      },
    },
    async (input) => json(await service.documentAdd({ ownerId, ...input })),
  )
  server.registerTool(
    'mindmap_document_index',
    {
      description: toolDescriptions.mindmap_document_index,
      inputSchema: {
        documentId: z.string(),
      },
    },
    async ({ documentId }) => json(await service.documentIndex(ownerId, documentId)),
  )
  server.registerTool(
    'mindmap_export',
    {
      description: toolDescriptions.mindmap_export,
      inputSchema: {
        planningId: z.string(),
        formats: z.array(z.enum(['opml', 'png', 'markdown'])).optional(),
      },
    },
    async ({ planningId, formats }) => {
      const result = await service.export(ownerId, planningId, formats)
      return exportToolResult(planningId, result)
    },
  )
  server.registerTool(
    'mindmap_guide',
    {
      description: toolDescriptions.mindmap_guide,
      inputSchema: {},
    },
    async () => ({ content: [{ type: 'text', text: await service.guide() }] }),
  )
}

function json(value: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

export function exportToolResult(
  planningId: string,
  result: Record<string, unknown>,
): {
  content: Array<
    | { type: 'text'; text: string }
    | {
        type: 'resource_link'
        uri: string
        name: string
        title: string
        size?: number
        mimeType: string
      }
  >
} {
  const artifacts = result.artifacts as Array<{
    format: 'opml' | 'png' | 'markdown'
    resourceUri: string
    bytes?: number
  }>
  return {
    content: [
      { type: 'text', text: JSON.stringify(result, null, 2) },
      ...artifacts.map((artifact) => {
        const link = {
          type: 'resource_link' as const,
          uri: artifact.resourceUri,
          name: `${planningId}-${artifact.format}`,
          title: `Mind-map ${artifact.format.toUpperCase()} export`,
          mimeType: artifactMimeType(artifact.format),
        }
        return artifact.bytes === undefined ? link : { ...link, size: artifact.bytes }
      }),
    ],
  }
}

function artifactMimeType(format: 'opml' | 'png' | 'markdown'): string {
  if (format === 'png') return 'image/png'
  if (format === 'markdown') return 'text/markdown'
  return 'text/x-opml'
}

export function registerResources(
  server: Pick<McpServer, 'registerResource'>,
  service: MindMapService,
): void {
  const ownerId = 'local'
  const read = async (uri: URL) => {
    const resource = await service.readResource(ownerId, uri.toString())
    return {
      contents: [
        resource.blob
          ? { uri: resource.uri, mimeType: resource.mimeType, blob: resource.blob }
          : { uri: resource.uri, mimeType: resource.mimeType, text: resource.text ?? '' },
      ],
    }
  }
  server.registerResource(
    'mindmap_guide',
    'mindmap://guide',
    {
      title: 'Mind-map tool flow guide',
      mimeType: 'text/markdown',
      description: 'AI-readable recipe for using the MindGeniusAI MCP tools.',
    },
    read,
  )
  server.registerResource(
    'mindmap_plan',
    new ResourceTemplate('mindmap://plans/{planningId}', { list: undefined }),
    { title: 'Mind-map plan', mimeType: 'application/json' },
    read,
  )
  server.registerResource(
    'mindmap_plan_outline',
    new ResourceTemplate('mindmap://plans/{planningId}/outline', { list: undefined }),
    { title: 'Mind-map outline', mimeType: 'application/json' },
    read,
  )
  server.registerResource(
    'mindmap_plan_markdown',
    new ResourceTemplate('mindmap://plans/{planningId}/markdown', { list: undefined }),
    { title: 'Mind-map markdown', mimeType: 'text/markdown' },
    read,
  )
  server.registerResource(
    'mindmap_plan_events',
    new ResourceTemplate('mindmap://plans/{planningId}/events', { list: undefined }),
    { title: 'Mind-map event log', mimeType: 'application/x-ndjson' },
    read,
  )
  server.registerResource(
    'mindmap_export',
    new ResourceTemplate('mindmap://exports/{planningId}/{version}/{format}', {
      list: undefined,
    }),
    { title: 'Mind-map export artifact' },
    read,
  )
}
