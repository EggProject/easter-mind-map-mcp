import { describe, expect, it } from 'bun:test'
import { loadConfig } from '../src/config'

describe('server configuration', () => {
  it('starts the bundled MindGeniusAI upstream by default', () => {
    const config = loadConfig({})
    expect(config.upstreamStartCommand).toBe('pnpm --dir original-MindGeniusAI dev:server')
    expect(config.upstreamInstallCommand).toBe(
      'pnpm --dir original-MindGeniusAI install --frozen-lockfile',
    )
    expect(config.upstreamEnv.PORT).toBe('8787')
    expect(config.upstreamEnv.COREPACK_ENABLE_STRICT).toBe('0')
    expect(config.upstreamEnv.COREPACK_ENABLE_PROJECT_SPEC).toBe('0')
    expect(config.logLevel).toBe('NONE')
    expect(config.logPath).toBe('/tmp/easter-mind-map-mcp/logs/mcp.log')
    expect(config.dataDir).toBe('/tmp/easter-mind-map-mcp/data')
    expect(config.allowedDocumentRoots).toEqual(['/tmp/easter-mind-map-mcp/documents'])
    expect(config.upstreamWorkingDirectory).toBe(config.projectRoot)
    expect(config.upstreamInstallCheckPath).toBe(
      `${config.projectRoot}/original-MindGeniusAI/node_modules`,
    )
  })

  it('allows the upstream start command to be overridden', () => {
    expect(
      loadConfig({ EASTER_MIND_MAP_MCP_MINDGENIUS_START_COMMAND: 'custom-start' })
        .upstreamStartCommand,
    ).toBe('custom-start')
  })

  it('passes prefixed MindGeniusAI env values and derives the base URL from PORT', () => {
    const config = loadConfig({
      EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_PORT: '9999',
      EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_LLM_PROVIDER: 'minimax',
      EASTER_MIND_MAP_MCP_MINDGENIUS_ENV_MINIMAX_API_KEY: 'sk-test',
      EASTER_MIND_MAP_MCP_MINDGENIUS_INSTALL_COMMAND: 'custom-install',
    })

    expect(config.upstreamBaseUrl).toBe('http://127.0.0.1:9999')
    expect(config.upstreamEnv.PORT).toBe('9999')
    expect(config.upstreamEnv.LLM_PROVIDER).toBe('minimax')
    expect(config.upstreamEnv.MINIMAX_API_KEY).toBe('sk-test')
    expect(config.upstreamInstallCommand).toBe('custom-install')
  })

  it('falls back to the default upstream port when base URL parsing fails', () => {
    expect(
      loadConfig({ EASTER_MIND_MAP_MCP_MINDGENIUS_BASE_URL: 'not a url' }).upstreamEnv.PORT,
    ).toBe('8787')
  })

  it('reads prefixed logging and storage paths from env', () => {
    const config = loadConfig({
      EASTER_MIND_MAP_MCP_LOGLEVEL: 'debug',
      EASTER_MIND_MAP_MCP_LOGPATH: '/tmp/custom.log',
      EASTER_MIND_MAP_MCP_MINDMAP_DATA_DIR: 'custom-data',
      EASTER_MIND_MAP_MCP_MINDMAP_DOCUMENT_ROOTS: '/tmp/docs-a,relative-docs',
    })
    expect(config.logLevel).toBe('DEBUG')
    expect(config.logPath).toBe('/tmp/custom.log')
    expect(config.dataDir).toBe(`${config.projectRoot}/custom-data`)
    expect(config.allowedDocumentRoots).toEqual([
      '/tmp/docs-a',
      `${config.projectRoot}/relative-docs`,
    ])
  })

  it('does not read legacy unprefixed adapter env names', () => {
    const config = loadConfig({
      LOGLEVEL: 'DEBUG',
      MINDMAP_DATA_DIR: 'legacy-data',
      MINDGENIUS_ENV_MINIMAX_API_KEY: 'legacy-key',
    })
    expect(config.logLevel).toBe('NONE')
    expect(config.dataDir).toBe('/tmp/easter-mind-map-mcp/data')
    expect(config.upstreamEnv.MINIMAX_API_KEY).toBeUndefined()
  })
})
