import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export type LogLevel = 'NONE' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
}

const SECRET_KEY_PATTERN = /(api[_-]?key|token|secret|password|authorization|auth)/i

export interface Logger {
  readonly level: LogLevel
  readonly path: string
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
}

export function normalizeLogLevel(value: string | undefined): LogLevel {
  const normalized = value?.trim().toUpperCase()
  if (
    normalized === 'ERROR' ||
    normalized === 'WARN' ||
    normalized === 'INFO' ||
    normalized === 'DEBUG'
  )
    return normalized
  return 'NONE'
}

export function createLogger(level: LogLevel, path: string): Logger {
  return new FileLogger(level, path)
}

export function redactForLog(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? '<redacted>' : entry,
    ]),
  )
}

class FileLogger implements Logger {
  constructor(
    readonly level: LogLevel,
    readonly path: string,
  ) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('DEBUG', message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('INFO', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('WARN', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('ERROR', message, meta)
  }

  private write(
    level: Exclude<LogLevel, 'NONE'>,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LEVEL_WEIGHT[this.level] < LEVEL_WEIGHT[level]) return
    try {
      mkdirSync(dirname(this.path), { recursive: true })
      appendFileSync(
        this.path,
        `${new Date().toISOString()} ${level} ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}\n`,
      )
    } catch {
      // Logging must never break the MCP stdio protocol.
    }
  }
}
