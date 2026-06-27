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
  })

  it('allows the upstream start command to be overridden', () => {
    expect(loadConfig({ MINDGENIUS_START_COMMAND: 'custom-start' }).upstreamStartCommand).toBe(
      'custom-start',
    )
  })

  it('passes MindGeniusAI env values and derives the base URL from PORT', () => {
    const config = loadConfig({
      MINDGENIUS_ENV_PORT: '9999',
      MINDGENIUS_ENV_LLM_PROVIDER: 'minimax',
      MINDGENIUS_ENV_MINIMAX_API_KEY: 'sk-test',
      MINDGENIUS_INSTALL_COMMAND: 'custom-install',
    })

    expect(config.upstreamBaseUrl).toBe('http://127.0.0.1:9999')
    expect(config.upstreamEnv.PORT).toBe('9999')
    expect(config.upstreamEnv.LLM_PROVIDER).toBe('minimax')
    expect(config.upstreamEnv.MINIMAX_API_KEY).toBe('sk-test')
    expect(config.upstreamInstallCommand).toBe('custom-install')
  })

  it('falls back to the default upstream port when base URL parsing fails', () => {
    expect(loadConfig({ MINDGENIUS_BASE_URL: 'not a url' }).upstreamEnv.PORT).toBe('8787')
  })
})
