import type { AgentEvent } from '../types'

export const AGENT_EVENT_PREFIX = 'agent:'

export interface SseEnvelope {
  status: 'pending' | 'done' | 'failed'
  data?: string
}

export function decodeAgentEvent(data: string): AgentEvent | null {
  if (!data.startsWith(AGENT_EVENT_PREFIX)) return null
  try {
    return JSON.parse(data.slice(AGENT_EVENT_PREFIX.length)) as AgentEvent
  } catch {
    return null
  }
}

export async function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  onEnvelope: (envelope: SseEnvelope) => Promise<void> | void,
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let separator = buffer.search(/\r?\n\r?\n/)
      while (separator >= 0) {
        const frame = buffer.slice(0, separator)
        buffer = buffer.slice(frame.match(/\r?\n\r?\n/)?.[0].length ?? separator + 2)
        const envelope = parseFrame(frame)
        if (envelope) await onEnvelope(envelope)
        separator = buffer.search(/\r?\n\r?\n/)
      }
    }
    const tail = buffer.trim()
    if (tail) {
      const envelope = parseFrame(tail)
      if (envelope) await onEnvelope(envelope)
    }
  } finally {
    reader.releaseLock()
  }
}

function parseFrame(frame: string): SseEnvelope | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (!data) return null
  try {
    return JSON.parse(data) as SseEnvelope
  } catch {
    return null
  }
}
