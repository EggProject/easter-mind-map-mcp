import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeLogLevel } from './logger'
import type { ConcurrencyConfig } from './types'
import type { LogLevel } from './logger'

export interface ServerConfig {
  projectRoot: string
  upstreamBaseUrl: string
  upstreamStartCommand?: string
  upstreamInstallCommand?: string
  upstreamInstallCheckPath?: string
  upstreamWorkingDirectory: string
  upstreamEnv: Record<string, string>
  upstreamHealthTimeoutMs: number
  logLevel: LogLevel
  logPath: string
  dataDir: string
  allowedDocumentRoots: string[]
  concurrency: ConcurrencyConfig
}

const DEFAULT_UPSTREAM_START_COMMAND = 'pnpm --dir original-MindGeniusAI dev:server'
const DEFAULT_UPSTREAM_INSTALL_COMMAND =
  'pnpm --dir original-MindGeniusAI install --frozen-lockfile'
const ENV_PREFIX = 'EASTER_MIND_MAP_MCP_'
const UPSTREAM_ENV_PREFIX = `${ENV_PREFIX}MINDGENIUS_ENV_`
const DEFAULT_BASE_DIR = '/tmp/easter-mind-map-mcp'
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SYSTEM_ENV_KEYS = [
  'HOME',
  'LANG',
  'LOGNAME',
  'PATH',
  'SHELL',
  'TERM',
  'TMPDIR',
  'USER',
  '__CF_USER_TEXT_ENCODING',
]

export function loadConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const projectRoot = PROJECT_ROOT
  const upstreamPort = envValue(env, 'MINDGENIUS_ENV_PORT')
  const upstreamBaseUrl =
    envValue(env, 'MINDGENIUS_BASE_URL') ?? `http://127.0.0.1:${upstreamPort ?? 8787}`
  return {
    projectRoot,
    upstreamBaseUrl,
    upstreamStartCommand:
      envValue(env, 'MINDGENIUS_START_COMMAND') ?? DEFAULT_UPSTREAM_START_COMMAND,
    upstreamInstallCommand:
      envValue(env, 'MINDGENIUS_INSTALL_COMMAND') ?? DEFAULT_UPSTREAM_INSTALL_COMMAND,
    upstreamInstallCheckPath: resolve(projectRoot, 'original-MindGeniusAI/node_modules'),
    upstreamWorkingDirectory: projectRoot,
    upstreamEnv: upstreamEnvFrom(env, upstreamBaseUrl),
    upstreamHealthTimeoutMs: numberFromEnv(envValue(env, 'MINDGENIUS_HEALTH_TIMEOUT_MS'), 30_000),
    logLevel: normalizeLogLevel(envValue(env, 'LOGLEVEL')),
    logPath: pathFromEnv(envValue(env, 'LOGPATH'), `${DEFAULT_BASE_DIR}/logs/mcp.log`, projectRoot),
    dataDir: pathFromEnv(
      envValue(env, 'MINDMAP_DATA_DIR'),
      `${DEFAULT_BASE_DIR}/data`,
      projectRoot,
    ),
    allowedDocumentRoots: (
      envValue(env, 'MINDMAP_DOCUMENT_ROOTS') ?? `${DEFAULT_BASE_DIR}/documents`
    )
      .split(',')
      .map((root) => root.trim())
      .filter(Boolean)
      .map((root) => pathFromEnv(root, root, projectRoot)),
    concurrency: {
      maxConcurrentRunsGlobal: numberFromEnv(envValue(env, 'MINDMAP_MAX_RUNS_GLOBAL'), 4),
      maxConcurrentRunsPerOwner: numberFromEnv(envValue(env, 'MINDMAP_MAX_RUNS_PER_OWNER'), 2),
      maxConcurrentRunsPerPlanning: 1,
      maxConcurrentDocumentIndexes: numberFromEnv(envValue(env, 'MINDMAP_MAX_DOCUMENT_INDEXES'), 2),
      upstreamRequestTimeoutMs: numberFromEnv(
        envValue(env, 'MINDMAP_UPSTREAM_TIMEOUT_MS'),
        180_000,
      ),
      maxRetries: numberFromEnv(envValue(env, 'MINDMAP_MAX_RETRIES'), 1),
    },
  }
}

function envValue(env: Record<string, string | undefined>, name: string): string | undefined {
  return env[`${ENV_PREFIX}${name}`]
}

function pathFromEnv(value: string | undefined, fallback: string, projectRoot: string): string {
  const raw = value?.trim() || fallback
  return isAbsolute(raw) ? resolve(raw) : resolve(projectRoot, raw)
}

function upstreamEnvFrom(
  env: Record<string, string | undefined>,
  upstreamBaseUrl: string,
): Record<string, string> {
  const upstreamEnv: Record<string, string> = {}
  for (const key of SYSTEM_ENV_KEYS) {
    const value = env[key]
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
