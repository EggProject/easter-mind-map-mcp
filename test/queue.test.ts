import { describe, expect, it } from 'bun:test'
import { RunQueue } from '../src/queue'

describe('run queue', () => {
  it('cancels a pending job before it starts', async () => {
    const queue = new RunQueue({
      maxConcurrentRunsGlobal: 1,
      maxConcurrentRunsPerOwner: 1,
      maxConcurrentRunsPerPlanning: 1,
    })
    const completed: string[] = []

    queue.enqueue({
      ownerId: 'u1',
      planningId: 'p1',
      runId: 'r1',
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        completed.push('r1')
      },
    })
    queue.enqueue({
      ownerId: 'u1',
      planningId: 'p2',
      runId: 'r2',
      execute: async () => {
        completed.push('r2')
      },
    })

    expect(queue.cancel('r2')).toBe(true)
    await eventually(() => {
      expect(completed).toEqual(['r1'])
      expect(queue.snapshot()).toEqual({ active: 0, pending: 0, activePlans: [] })
    })
  })

  it('settles rejected jobs and continues draining', async () => {
    const queue = new RunQueue({
      maxConcurrentRunsGlobal: 1,
      maxConcurrentRunsPerOwner: 1,
      maxConcurrentRunsPerPlanning: 1,
    })
    const completed: string[] = []

    queue.enqueue({
      ownerId: 'u1',
      planningId: 'p1',
      runId: 'r1',
      execute: async () => {
        throw new Error('boom')
      },
    })
    queue.enqueue({
      ownerId: 'u1',
      planningId: 'p2',
      runId: 'r2',
      execute: async () => {
        completed.push('r2')
      },
    })

    await eventually(() => {
      expect(completed).toEqual(['r2'])
      expect(queue.snapshot()).toEqual({ active: 0, pending: 0, activePlans: [] })
    })
  })
})

async function eventually(assertion: () => void): Promise<void> {
  const started = Date.now()
  let lastError: unknown
  while (Date.now() - started < 1_000) {
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
