import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { createLogger, normalizeLogLevel, redactForLog } from '../src/logger'

describe('file logger', () => {
  it('normalizes log levels with NONE as the safe default', () => {
    expect(normalizeLogLevel(undefined)).toBe('NONE')
    expect(normalizeLogLevel('')).toBe('NONE')
    expect(normalizeLogLevel('verbose')).toBe('NONE')
    expect(normalizeLogLevel('error')).toBe('ERROR')
    expect(normalizeLogLevel('WARN')).toBe('WARN')
    expect(normalizeLogLevel(' info ')).toBe('INFO')
    expect(normalizeLogLevel('debug')).toBe('DEBUG')
  })

  it('does not create log files at NONE level', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mindmap-log-none-'))
    const logPath = join(dir, 'logs', 'runtime.log')
    const logger = createLogger('NONE', logPath)

    logger.error('hidden error')
    logger.warn('hidden warning')
    logger.info('hidden info')
    logger.debug('hidden debug')

    expect(existsSync(logPath)).toBe(false)
  })

  it('writes enabled levels and metadata to a file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mindmap-log-debug-'))
    const logPath = join(dir, 'logs', 'runtime.log')
    const logger = createLogger('DEBUG', logPath)

    logger.error('error event', { code: 1 })
    logger.warn('warning event')
    logger.info('info event')
    logger.debug('debug event', { line: 'MindGeniusAI output' })

    const output = readFileSync(logPath, 'utf8')
    expect(output).toContain('ERROR error event {"code":1}')
    expect(output).toContain('WARN warning event')
    expect(output).toContain('INFO info event')
    expect(output).toContain('DEBUG debug event {"line":"MindGeniusAI output"}')
  })

  it('redacts secret-looking metadata values before debug logging', () => {
    expect(
      redactForLog({
        MINIMAX_API_KEY: 'sk-test',
        PORT: '8787',
        password: 'secret',
      }),
    ).toEqual({
      MINIMAX_API_KEY: '<redacted>',
      PORT: '8787',
      password: '<redacted>',
    })
  })
})
