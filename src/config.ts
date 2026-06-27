import { resolve } from 'node:path'
import type { ConcurrencyConfig } from './types'

export interface ServerConfig {
  upstreamBaseUrl: string
  upstreamStartCommand?: string
  upstreamHealthTimeoutMs: number
  dataDir: string
  allowedDocumentRoots: string[]
  concurrency: ConcurrencyConfig
}

export function loadConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const cwd = process.cwd()
  return {
    upstreamBaseUrl: env.MINDGENIUS_BASE_URL ?? 'http://127.0.0.1:8787',
    upstreamStartCommand: env.MINDGENIUS_START_COMMAND,
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

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
