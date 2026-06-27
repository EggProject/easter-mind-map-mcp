export interface QueueJob {
  ownerId: string
  planningId: string
  runId: string
  execute: (signal: AbortSignal) => Promise<void>
}

export interface QueueLimits {
  maxConcurrentRunsGlobal: number
  maxConcurrentRunsPerOwner: number
  maxConcurrentRunsPerPlanning: 1
}

export class RunQueue {
  private readonly pending: QueueJob[] = []
  private readonly active = new Map<string, AbortController>()
  private readonly activeByOwner = new Map<string, number>()
  private readonly activePlans = new Set<string>()

  constructor(private readonly limits: QueueLimits) {}

  enqueue(job: QueueJob): void {
    this.pending.push(job)
    queueMicrotask(() => this.drain())
  }

  cancel(runId: string): boolean {
    const pendingIndex = this.pending.findIndex((job) => job.runId === runId)
    if (pendingIndex >= 0) {
      this.pending.splice(pendingIndex, 1)
      return true
    }
    const controller = this.active.get(runId)
    if (!controller) return false
    controller.abort()
    return true
  }

  snapshot(): { active: number; pending: number; activePlans: string[] } {
    return {
      active: this.active.size,
      pending: this.pending.length,
      activePlans: [...this.activePlans],
    }
  }

  private drain(): void {
    let started = true
    while (started) {
      started = false
      const index = this.pending.findIndex((job) => this.canStart(job))
      if (index < 0) return
      const [job] = this.pending.splice(index, 1)
      this.start(job)
      started = true
    }
  }

  private canStart(job: QueueJob): boolean {
    if (this.active.size >= this.limits.maxConcurrentRunsGlobal) return false
    if ((this.activeByOwner.get(job.ownerId) ?? 0) >= this.limits.maxConcurrentRunsPerOwner)
      return false
    return !this.activePlans.has(job.planningId)
  }

  private start(job: QueueJob): void {
    const controller = new AbortController()
    this.active.set(job.runId, controller)
    this.activePlans.add(job.planningId)
    this.activeByOwner.set(job.ownerId, (this.activeByOwner.get(job.ownerId) ?? 0) + 1)
    void job
      .execute(controller.signal)
      .catch(() => undefined)
      .finally(() => {
        this.active.delete(job.runId)
        this.activePlans.delete(job.planningId)
        const ownerCount = (this.activeByOwner.get(job.ownerId) ?? 1) - 1
        if (ownerCount <= 0) this.activeByOwner.delete(job.ownerId)
        else this.activeByOwner.set(job.ownerId, ownerCount)
        this.drain()
      })
  }
}
