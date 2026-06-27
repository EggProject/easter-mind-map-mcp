import { existsSync } from 'node:fs'
import { basename } from 'node:path'
import { redactForLog } from '../logger'
import type { Logger } from '../logger'
import type { AgentRequest, RunAgentOptions, UpstreamClient } from '../types'
import { decodeAgentEvent, parseSseStream } from './sse'

interface UpstreamProcessOptions {
  env?: Record<string, string>
  logger?: Logger
}

export class HttpUpstreamClient implements UpstreamClient {
  private supervisorStarted = false
  private installPromise?: Promise<void>

  constructor(
    private readonly baseUrl: string,
    private readonly startCommand?: string,
    private readonly healthTimeoutMs = 30_000,
    private readonly startUpstream: (
      command: string,
      options?: UpstreamProcessOptions,
    ) => void = defaultStartUpstream,
    private readonly requestTimeoutMs = 180_000,
    private readonly installCommand?: string,
    private readonly installCheckPath?: string,
    private readonly upstreamEnv: Record<string, string> = process.env as Record<string, string>,
    private readonly runInstallCommand: (
      command: string,
      options?: UpstreamProcessOptions,
    ) => Promise<void> = defaultRunCommand,
    private readonly logger?: Logger,
  ) {}

  async ensureReady(signal?: AbortSignal): Promise<void> {
    this.logger?.debug('checking MindGeniusAI upstream health', { baseUrl: this.baseUrl })
    if (await this.isHealthy(signal)) {
      this.logger?.info('MindGeniusAI upstream is healthy', { baseUrl: this.baseUrl })
      return
    }
    if (this.startCommand && !this.supervisorStarted) {
      await this.ensureInstalled()
      this.supervisorStarted = true
      this.logger?.info('starting MindGeniusAI upstream', { command: this.startCommand })
      this.logger?.debug('MindGeniusAI upstream start environment', {
        env: redactForLog(this.upstreamEnv),
      })
      this.startUpstream(this.startCommand, { env: this.upstreamEnv, logger: this.logger })
    }
    const started = Date.now()
    while (Date.now() - started < this.healthTimeoutMs) {
      if (await this.isHealthy(signal)) {
        this.logger?.info('MindGeniusAI upstream became healthy', { baseUrl: this.baseUrl })
        return
      }
      await sleep(250, signal)
    }
    this.logger?.error('MindGeniusAI upstream health timeout', {
      baseUrl: this.baseUrl,
      healthTimeoutMs: this.healthTimeoutMs,
    })
    throw new Error('MindGeniusAI upstream did not become healthy before timeout')
  }

  async runAgent({ request, signal, onEvent }: RunAgentOptions): Promise<void> {
    this.logger?.info('calling MindGeniusAI agent endpoint')
    this.logger?.debug('MindGeniusAI agent request', {
      hasFileName: Boolean(request.fileName),
      hasMindMap: Boolean(request.mindMap),
      messageCount: request.messages.length,
    })
    const timeoutController = new AbortController()
    const timeout = setTimeout(() => timeoutController.abort(), this.requestTimeoutMs)
    const abortFromCaller = () => timeoutController.abort()
    signal.addEventListener('abort', abortFromCaller, { once: true })
    const response = await fetch(`${this.baseUrl}/api/agent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request satisfies AgentRequest),
      signal: timeoutController.signal,
    })
    try {
      if (!response.ok) {
        this.logger?.error('MindGeniusAI agent endpoint failed', { status: response.status })
        throw new Error(`upstream /api/agent failed with ${response.status}`)
      }
      if (!response.body) {
        this.logger?.error('MindGeniusAI agent endpoint returned no SSE body')
        throw new Error('upstream /api/agent returned no SSE body')
      }
      await parseSseStream(response.body, async (envelope) => {
        this.logger?.debug('MindGeniusAI SSE envelope', {
          hasData: Boolean(envelope.data),
          status: envelope.status,
        })
        if (envelope.status === 'failed') {
          this.logger?.error('MindGeniusAI SSE failed', { data: envelope.data })
          throw new Error(envelope.data ?? 'upstream SSE failed')
        }
        if (envelope.status === 'done') return
        if (!envelope.data) return
        const event = decodeAgentEvent(envelope.data)
        if (event) await onEvent(event)
      })
      if (timeoutController.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      this.logger?.info('MindGeniusAI agent stream completed')
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abortFromCaller)
    }
  }

  async uploadDocument(path: string, displayName?: string, signal?: AbortSignal): Promise<string> {
    this.logger?.info('uploading document to MindGeniusAI', { displayName, path })
    const file = Bun.file(path)
    if ((await file.size) > 10 * 1024 * 1024) throw new Error('PDF exceeds upstream 10 MB limit')
    const form = new FormData()
    form.set('file', file, displayName ?? basename(path))
    const response = await fetch(`${this.baseUrl}/api/uploadFile`, {
      method: 'POST',
      body: form,
      signal,
    })
    if (!response.ok) {
      this.logger?.error('MindGeniusAI document upload failed', { status: response.status })
      throw new Error(`upstream /api/uploadFile failed with ${response.status}`)
    }
    const body = (await response.json()) as { fileName?: string }
    if (!body.fileName) {
      this.logger?.error('MindGeniusAI document upload response did not contain fileName')
      throw new Error('upstream upload response did not contain fileName')
    }
    this.logger?.info('document uploaded to MindGeniusAI', { fileName: body.fileName })
    return body.fileName
  }

  async indexDocument(upstreamFileName: string, signal?: AbortSignal): Promise<void> {
    this.logger?.info('indexing document in MindGeniusAI', { fileName: upstreamFileName })
    const response = await fetch(`${this.baseUrl}/api/document/init`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: upstreamFileName }),
      signal,
    })
    if (!response.ok) {
      this.logger?.error('MindGeniusAI document indexing failed', { status: response.status })
      throw new Error(`upstream /api/document/init failed with ${response.status}`)
    }
    this.logger?.info('document indexed in MindGeniusAI', { fileName: upstreamFileName })
  }

  private async isHealthy(signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, { signal })
      this.logger?.debug('MindGeniusAI health response', { status: response.status })
      return response.ok
    } catch (error) {
      this.logger?.debug('MindGeniusAI health check failed', { error: String(error) })
      return false
    }
  }

  private async ensureInstalled(): Promise<void> {
    if (!this.installCommand) {
      this.logger?.debug('MindGeniusAI install skipped because no command is configured')
      return
    }
    if (this.installCheckPath && existsSync(this.installCheckPath)) {
      this.logger?.debug('MindGeniusAI install skipped because dependency marker exists', {
        installCheckPath: this.installCheckPath,
      })
      return
    }
    this.logger?.info('installing MindGeniusAI dependencies', { command: this.installCommand })
    this.installPromise ??= this.runInstallCommand(this.installCommand, {
      env: this.upstreamEnv,
      logger: this.logger,
    })
    await this.installPromise
    this.logger?.info('MindGeniusAI dependencies installed')
  }
}

function defaultStartUpstream(command: string, options?: UpstreamProcessOptions): void {
  const logger = options?.logger
  const debugOutput = logger?.level === 'DEBUG'
  const process = Bun.spawn(command.split(/\s+/), {
    stdout: debugOutput ? 'pipe' : 'ignore',
    stderr: debugOutput ? 'pipe' : 'ignore',
    env: options?.env,
  })
  if (debugOutput) {
    void logProcessOutput(process.stdout, logger, 'MindGeniusAI stdout')
    void logProcessOutput(process.stderr, logger, 'MindGeniusAI stderr')
  }
  process.unref()
}

async function defaultRunCommand(command: string, options?: UpstreamProcessOptions): Promise<void> {
  const logger = options?.logger
  const debugOutput = logger?.level === 'DEBUG'
  const process = Bun.spawn(command.split(/\s+/), {
    stdout: debugOutput ? 'pipe' : 'ignore',
    stderr: debugOutput ? 'pipe' : 'ignore',
    env: options?.env,
  })
  const outputLogs = debugOutput
    ? [
        logProcessOutput(process.stdout, logger, 'MindGeniusAI install stdout'),
        logProcessOutput(process.stderr, logger, 'MindGeniusAI install stderr'),
      ]
    : []
  const exitCode = await process.exited
  await Promise.all(outputLogs)
  if (exitCode !== 0) throw new Error(`Command failed with exit code ${exitCode}: ${command}`)
}

async function logProcessOutput(
  stream: ReadableStream<Uint8Array> | null | undefined,
  logger: Logger,
  message: string,
): Promise<void> {
  if (!stream) return
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffered = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffered += decoder.decode(value, { stream: true })
      const lines = buffered.split(/\r?\n/)
      buffered = lines.pop() ?? ''
      for (const line of lines) {
        if (line) logger.debug(message, { line })
      }
    }
    buffered += decoder.decode()
    if (buffered) logger.debug(message, { line: buffered })
  } finally {
    reader.releaseLock()
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timeout = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
