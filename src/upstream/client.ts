import { basename } from 'node:path'
import type { AgentRequest, RunAgentOptions, UpstreamClient } from '../types'
import { decodeAgentEvent, parseSseStream } from './sse'

export class HttpUpstreamClient implements UpstreamClient {
  private supervisorStarted = false

  constructor(
    private readonly baseUrl: string,
    private readonly startCommand?: string,
    private readonly healthTimeoutMs = 30_000,
    private readonly startUpstream: (command: string) => void = defaultStartUpstream,
    private readonly requestTimeoutMs = 180_000,
  ) {}

  async ensureReady(signal?: AbortSignal): Promise<void> {
    if (await this.isHealthy(signal)) return
    if (this.startCommand && !this.supervisorStarted) {
      this.supervisorStarted = true
      this.startUpstream(this.startCommand)
    }
    const started = Date.now()
    while (Date.now() - started < this.healthTimeoutMs) {
      if (await this.isHealthy(signal)) return
      await sleep(250, signal)
    }
    throw new Error('MindGeniusAI upstream did not become healthy before timeout')
  }

  async runAgent({ request, signal, onEvent }: RunAgentOptions): Promise<void> {
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
      if (!response.ok) throw new Error(`upstream /api/agent failed with ${response.status}`)
      if (!response.body) throw new Error('upstream /api/agent returned no SSE body')
      await parseSseStream(response.body, async (envelope) => {
        if (envelope.status === 'failed') throw new Error(envelope.data ?? 'upstream SSE failed')
        if (envelope.status === 'done') return
        if (!envelope.data) return
        const event = decodeAgentEvent(envelope.data)
        if (event) await onEvent(event)
      })
      if (timeoutController.signal.aborted) throw new DOMException('Aborted', 'AbortError')
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abortFromCaller)
    }
  }

  async uploadDocument(path: string, displayName?: string, signal?: AbortSignal): Promise<string> {
    const file = Bun.file(path)
    if ((await file.size) > 10 * 1024 * 1024) throw new Error('PDF exceeds upstream 10 MB limit')
    const form = new FormData()
    form.set('file', file, displayName ?? basename(path))
    const response = await fetch(`${this.baseUrl}/api/uploadFile`, {
      method: 'POST',
      body: form,
      signal,
    })
    if (!response.ok) throw new Error(`upstream /api/uploadFile failed with ${response.status}`)
    const body = (await response.json()) as { fileName?: string }
    if (!body.fileName) throw new Error('upstream upload response did not contain fileName')
    return body.fileName
  }

  async indexDocument(upstreamFileName: string, signal?: AbortSignal): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/document/init`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: upstreamFileName }),
      signal,
    })
    if (!response.ok) throw new Error(`upstream /api/document/init failed with ${response.status}`)
  }

  private async isHealthy(signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, { signal })
      return response.ok
    } catch {
      return false
    }
  }
}

function defaultStartUpstream(command: string): void {
  Bun.spawn(command.split(/\s+/), {
    stdout: 'ignore',
    stderr: 'ignore',
  }).unref()
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
