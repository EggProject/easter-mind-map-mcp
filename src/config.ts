import { resolve } from 'node:path'
import type { ConcurrencyConfig } from './types'

export interface ServerConfig {
  upstreamBaseUrl: string
  upstreamStartCommand?: string
  upstreamInstallCommand?: string
  upstreamInstallCheckPath?: string
  upstreamEnv: Record<string, string>
  upstreamHealthTimeoutMs: number
  dataDir: string
  allowedDocumentRoots: string[]
  concurrency: ConcurrencyConfig
}

const DEFAULT_UPSTREAM_START_COMMAND = 'pnpm --dir original-MindGeniusAI dev:server'
const DEFAULT_UPSTREAM_INSTALL_COMMAND =
  'pnpm --dir original-MindGeniusAI install --frozen-lockfile'
const UPSTREAM_ENV_PREFIX = 'MINDGENIUS_ENV_'

export function loadConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const cwd = process.cwd()
  const upstreamPort = env.MINDGENIUS_ENV_PORT ?? env.PORT
  const upstreamBaseUrl = env.MINDGENIUS_BASE_URL ?? `http://127.0.0.1:${upstreamPort ?? 8787}`
  return {
    upstreamBaseUrl,
    upstreamStartCommand: env.MINDGENIUS_START_COMMAND ?? DEFAULT_UPSTREAM_START_COMMAND,
    upstreamInstallCommand: env.MINDGENIUS_INSTALL_COMMAND ?? DEFAULT_UPSTREAM_INSTALL_COMMAND,
    upstreamInstallCheckPath: resolve(cwd, 'original-MindGeniusAI/node_modules'),
    upstreamEnv: upstreamEnvFrom(env, upstreamBaseUrl),
    upstreamHealthTimeoutMs: numberFromEnv(env.MINDGENIUS_HEALTH_TIMEOUT_MS, 30_000),
    dataDir: resolve(cwd, env.MINDMAP_DATA_DIR ?? 'data'),
    allowedDocumentRoots: (env.MINDMAP_DOCUMENT_ROOTS ?? resolve(cwd, 'documents'))
      .split(',')
      .map((root) => resolve(root.trim()))
      .filter(Boolean),
    concurrency: {
      maxConcurrentRunsGlobal: numberFromEnv(env.MINDMAP_MAX_RUNS_GLOBAL, 4),
      maxConcurrentRunsPerOwner: numberFromEnv(env.MINDMAP_MAX_RUNS_PER_OWNER, 2),
      maxConcurrentRunsPerPlanning: 1,
      maxConcurrentDocumentIndexes: numberFromEnv(env.MINDMAP_MAX_DOCUMENT_INDEXES, 2),
      upstreamRequestTimeoutMs: numberFromEnv(env.MINDMAP_UPSTREAM_TIMEOUT_MS, 180_000),
      maxRetries: numberFromEnv(env.MINDMAP_MAX_RETRIES, 1),
    },
  }
}

function upstreamEnvFrom(
  env: Record<string, string | undefined>,
  upstreamBaseUrl: string,
): Record<string, string> {
  const upstreamEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) upstreamEnv[key] = value
  }
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(UPSTREAM_ENV_PREFIX) && value !== undefined) {
      upstreamEnv[key.slice(UPSTREAM_ENV_PREFIX.length)] = value
    }
  }
  upstreamEnv.PORT ??= portFromUrl(upstreamBaseUrl)
  upstreamEnv.COREPACK_ENABLE_STRICT ??= '0'
  upstreamEnv.COREPACK_ENABLE_PROJECT_SPEC ??= '0'
  return upstreamEnv
}

function portFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
  } catch {
    return '8787'
  }
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
