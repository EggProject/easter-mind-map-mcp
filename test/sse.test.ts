import { describe, expect, it } from 'bun:test'
import { decodeAgentEvent, parseSseStream } from '../src/upstream/sse'

describe('upstream SSE parser', () => {
  it('decodes agent-prefixed events and ignores legacy payloads', () => {
    expect(decodeAgentEvent('agent:{"type":"step-finish"}')).toEqual({ type: 'step-finish' })
    expect(decodeAgentEvent('agent:{bad json')).toBeNull()
    expect(decodeAgentEvent('plain token')).toBeNull()
  })

  it('parses data frames', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"status":"pending","data":"agent:{\\"type\\":\\"step-finish\\"}"}\n\n',
          ),
        )
        controller.enqueue(new TextEncoder().encode('data: {"status":"done"}\n\n'))
        controller.close()
      },
    })
    const statuses: string[] = []
    await parseSseStream(stream, (envelope) => {
      statuses.push(envelope.status)
    })
    expect(statuses).toEqual(['pending', 'done'])
  })

  it('parses trailing frames and ignores malformed frame data', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: not-json\n\ndata: {"status":"done","data":"tail"}'),
        )
        controller.close()
      },
    })
    const envelopes: unknown[] = []

    await parseSseStream(stream, (envelope) => {
      envelopes.push(envelope)
    })

    expect(envelopes).toEqual([{ status: 'done', data: 'tail' }])
  })
})
