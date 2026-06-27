import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { HttpUpstreamClient } from '../src/upstream/client'

const originalFetch = globalThis.fetch
type FetchInput = Parameters<typeof fetch>[0]
type FetchInit = Parameters<typeof fetch>[1]

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('HTTP upstream client SSE hygiene', () => {
  it('starts the default supervisor command until health turns green', async () => {
    let healthChecks = 0
    globalThis.fetch = (async () => {
      healthChecks += 1
      return new Response(null, { status: healthChecks === 1 ? 503 : 200 })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test', 'true', 1_000)
    await client.ensureReady()
    expect(healthChecks).toBe(2)
  })

  it('runs the default install command before the default supervisor start when deps are missing', async () => {
    let healthChecks = 0
    globalThis.fetch = (async () => {
      healthChecks += 1
      return new Response(null, { status: healthChecks === 1 ? 503 : 200 })
    }) as unknown as typeof fetch
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-default-install-'))

    const client = new HttpUpstreamClient(
      'http://upstream.test',
      'true',
      1_000,
      undefined,
      180_000,
      'true',
      join(dataDir, 'missing-node-modules'),
      { PATH: process.env.PATH ?? '' },
    )

    await client.ensureReady()
    expect(healthChecks).toBe(2)
  })

  it('installs missing upstream dependencies and forwards env before starting', async () => {
    let started = false
    const calls: Array<{ type: string; command: string; env?: Record<string, string> }> = []
    globalThis.fetch = (async () =>
      new Response(null, { status: started ? 200 : 503 })) as unknown as typeof fetch
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-install-'))

    const client = new HttpUpstreamClient(
      'http://upstream.test',
      'start-upstream',
      1_000,
      (command, options) => {
        started = true
        calls.push({ type: 'start', command, env: options?.env })
      },
      180_000,
      'install-upstream',
      join(dataDir, 'node_modules'),
      { OPENAI_API_KEY: 'sk-test' },
      async (command, options) => {
        calls.push({ type: 'install', command, env: options?.env })
      },
    )

    await client.ensureReady()
    expect(calls.map((call) => `${call.type}:${call.command}`)).toEqual([
      'install:install-upstream',
      'start:start-upstream',
    ])
    expect(calls.every((call) => call.env?.OPENAI_API_KEY === 'sk-test')).toBe(true)
  })

  it('skips upstream dependency install when the marker path exists', async () => {
    let started = false
    let installCalls = 0
    globalThis.fetch = (async () =>
      new Response(null, { status: started ? 200 : 503 })) as unknown as typeof fetch
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-install-skip-'))
    const marker = join(dataDir, 'node_modules')
    await mkdir(marker)

    const client = new HttpUpstreamClient(
      'http://upstream.test',
      'start-upstream',
      1_000,
      () => {
        started = true
      },
      180_000,
      'install-upstream',
      marker,
      {},
      async () => {
        installCalls += 1
      },
    )

    await client.ensureReady()
    expect(installCalls).toBe(0)
  })

  it('times out when health never turns green', async () => {
    globalThis.fetch = (async () => new Response(null, { status: 503 })) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test', undefined, 1)
    await expect(client.ensureReady()).rejects.toThrow('did not become healthy')
  })

  it('propagates an already-aborted health wait', async () => {
    globalThis.fetch = (async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    const controller = new AbortController()
    controller.abort()

    const client = new HttpUpstreamClient('http://upstream.test', undefined, 1_000)
    await expect(client.ensureReady(controller.signal)).rejects.toThrow('Aborted')
  })

  it('aborts while waiting between health checks', async () => {
    globalThis.fetch = (async () => new Response(null, { status: 503 })) as unknown as typeof fetch
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10)

    const client = new HttpUpstreamClient('http://upstream.test', undefined, 1_000)
    await expect(client.ensureReady(controller.signal)).rejects.toThrow('Aborted')
  })

  it('passes AbortSignal to fetch and closes the stream on cancellation', async () => {
    let activeStreams = 0
    let sawAbort = false
    globalThis.fetch = (async (_input: FetchInput, init?: FetchInit) => {
      const signal = init?.signal as AbortSignal
      activeStreams += 1
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"status":"pending","data":"agent:{\\"type\\":\\"step-finish\\"}"}\n\n',
            ),
          )
          signal.addEventListener(
            'abort',
            () => {
              sawAbort = true
              activeStreams -= 1
              controller.close()
            },
            { once: true },
          )
        },
        cancel() {
          if (!sawAbort) activeStreams -= 1
        },
      })
      return new Response(stream, { status: 200 })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test')
    const controller = new AbortController()
    await expect(
      client.runAgent({
        request: { messages: [{ role: 'user', content: 'A' }] },
        signal: controller.signal,
        onEvent: () => controller.abort(),
      }),
    ).rejects.toThrow()
    await eventually(() => {
      expect(sawAbort).toBe(true)
      expect(activeStreams).toBe(0)
    })
  })

  it('aborts a hung SSE stream when the upstream request timeout expires', async () => {
    let activeStreams = 0
    let sawAbort = false
    globalThis.fetch = (async (_input: FetchInput, init?: FetchInit) => {
      const signal = init?.signal as AbortSignal
      activeStreams += 1
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          signal.addEventListener(
            'abort',
            () => {
              sawAbort = true
              activeStreams -= 1
              controller.close()
            },
            { once: true },
          )
        },
      })
      return new Response(stream, { status: 200 })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test', undefined, 30_000, undefined, 10)
    await expect(
      client.runAgent({
        request: { messages: [{ role: 'user', content: 'A' }] },
        signal: new AbortController().signal,
        onEvent: () => undefined,
      }),
    ).rejects.toThrow()
    await eventually(() => {
      expect(sawAbort).toBe(true)
      expect(activeStreams).toBe(0)
    })
  })

  it('handles upstream response errors and non-event SSE frames', async () => {
    globalThis.fetch = (async () => new Response(null, { status: 502 })) as unknown as typeof fetch
    const client = new HttpUpstreamClient('http://upstream.test')
    await expect(
      client.runAgent({
        request: { messages: [{ role: 'user', content: 'A' }] },
        signal: new AbortController().signal,
        onEvent: () => undefined,
      }),
    ).rejects.toThrow('502')

    globalThis.fetch = (async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              [
                'data: {"status":"pending"}',
                '',
                'data: {"status":"pending","data":"legacy"}',
                '',
                'data: {"status":"done"}',
                '',
                '',
              ].join('\n'),
            ),
          )
          controller.close()
        },
      })
      return new Response(stream, { status: 200 })
    }) as unknown as typeof fetch
    let events = 0
    await client.runAgent({
      request: { messages: [{ role: 'user', content: 'A' }] },
      signal: new AbortController().signal,
      onEvent: () => {
        events += 1
      },
    })
    expect(events).toBe(0)
  })

  it('fails when upstream returns a successful response without an SSE body', async () => {
    globalThis.fetch = (async () => new Response(null, { status: 200 })) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test')
    await expect(
      client.runAgent({
        request: { messages: [{ role: 'user', content: 'A' }] },
        signal: new AbortController().signal,
        onEvent: () => undefined,
      }),
    ).rejects.toThrow('returned no SSE body')
  })

  it('fails when the SSE stream reports an upstream error', async () => {
    globalThis.fetch = (async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"status":"failed","data":"boom"}\n\n'),
          )
          controller.close()
        },
      })
      return new Response(stream, { status: 200 })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test')
    await expect(
      client.runAgent({
        request: { messages: [{ role: 'user', content: 'A' }] },
        signal: new AbortController().signal,
        onEvent: () => undefined,
      }),
    ).rejects.toThrow('boom')
  })

  it('uploads and indexes documents through the upstream HTTP API', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-upload-'))
    const pdfPath = join(dataDir, 'input.pdf')
    await writeFile(pdfPath, new Uint8Array([1, 2, 3]))
    const urls: string[] = []
    globalThis.fetch = (async (input: FetchInput) => {
      urls.push(String(input))
      if (String(input).endsWith('/api/uploadFile')) {
        return Response.json({ fileName: 'stored.pdf' })
      }
      return new Response(null, { status: 204 })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test')
    expect(await client.uploadDocument(pdfPath, 'Shown.pdf')).toBe('stored.pdf')
    await client.indexDocument('stored.pdf')
    expect(urls).toEqual([
      'http://upstream.test/api/uploadFile',
      'http://upstream.test/api/document/init',
    ])
  })

  it('rejects upload and indexing failures', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-upload-fail-'))
    const pdfPath = join(dataDir, 'input.pdf')
    await writeFile(pdfPath, new Uint8Array([1, 2, 3]))
    const client = new HttpUpstreamClient('http://upstream.test')

    globalThis.fetch = (async () => new Response(null, { status: 500 })) as unknown as typeof fetch
    await expect(client.uploadDocument(pdfPath)).rejects.toThrow('/api/uploadFile failed with 500')

    globalThis.fetch = (async () => Response.json({})) as unknown as typeof fetch
    await expect(client.uploadDocument(pdfPath)).rejects.toThrow('did not contain fileName')

    globalThis.fetch = (async () => new Response(null, { status: 409 })) as unknown as typeof fetch
    await expect(client.indexDocument('stored.pdf')).rejects.toThrow(
      '/api/document/init failed with 409',
    )
  })

  it('rejects oversized PDF uploads before calling upstream', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-upload-large-'))
    const pdfPath = join(dataDir, 'large.pdf')
    await writeFile(pdfPath, new Uint8Array(10 * 1024 * 1024 + 1))
    let fetchCalled = false
    globalThis.fetch = (async () => {
      fetchCalled = true
      return Response.json({ fileName: 'stored.pdf' })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient('http://upstream.test')
    await expect(client.uploadDocument(pdfPath)).rejects.toThrow('10 MB limit')
    expect(fetchCalled).toBe(false)
  })
})

async function eventually(assertion: () => void): Promise<void> {
  const started = Date.now()
  let lastError: unknown
  while (Date.now() - started < 1000) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  throw lastError
}
