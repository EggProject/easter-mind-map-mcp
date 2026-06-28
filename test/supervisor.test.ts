import { afterEach, describe, expect, it } from 'bun:test'
import { HttpUpstreamClient } from '../src/upstream/client'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('upstream supervisor', () => {
  it('starts the configured upstream command and waits for green health', async () => {
    let startCalls = 0
    let healthCalls = 0
    globalThis.fetch = (async () => {
      healthCalls += 1
      return new Response(JSON.stringify({ ok: true }), {
        status: startCalls > 0 ? 200 : 503,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const client = new HttpUpstreamClient(
      'http://upstream.test',
      'start-upstream',
      1000,
      (command) => {
        startCalls += 1
        expect(command).toBe('start-upstream')
      },
    )

    await client.ensureReady()
    expect(startCalls).toBe(1)
    expect(healthCalls).toBeGreaterThanOrEqual(2)
    await client.ensureReady()
    expect(startCalls).toBe(1)
  })
})
