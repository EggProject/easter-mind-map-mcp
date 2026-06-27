import { afterEach, describe, expect, it } from 'bun:test'
import { HttpUpstreamClient } from '../src/upstream/client'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('HTTP upstream client SSE hygiene', () => {
  it('passes AbortSignal to fetch and closes the stream on cancellation', async () => {
    let activeStreams = 0
    let sawAbort = false
    globalThis.fetch = (async (_input, init) => {
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
    }) as typeof fetch

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
    globalThis.fetch = (async (_input, init) => {
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
    }) as typeof fetch

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
