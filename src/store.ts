import type { MindMapDocument, MindMapEvent, MindMapPlan, MindMapRun } from './types'

interface StoreState {
  plans: Record<string, MindMapPlan>
  runs: Record<string, MindMapRun>
  events: Record<string, MindMapEvent[]>
  documents: Record<string, MindMapDocument>
  idempotency: Record<string, { planningId: string; runId: string }>
}

export interface Store {
  getPlan(id: string): Promise<MindMapPlan | undefined>
  listAllPlans(): Promise<MindMapPlan[]>
  listPlans(ownerId: string): Promise<MindMapPlan[]>
  savePlan(plan: MindMapPlan): Promise<void>
  getRun(id: string): Promise<MindMapRun | undefined>
  listRuns(planningId: string): Promise<MindMapRun[]>
  saveRun(run: MindMapRun): Promise<void>
  appendEvent(event: MindMapEvent): Promise<void>
  listEvents(planningId: string): Promise<MindMapEvent[]>
  getDocument(id: string): Promise<MindMapDocument | undefined>
  saveDocument(document: MindMapDocument): Promise<void>
  getIdempotency(
    ownerId: string,
    key: string,
  ): Promise<{ planningId: string; runId: string } | undefined>
  saveIdempotency(
    ownerId: string,
    key: string,
    value: { planningId: string; runId: string },
  ): Promise<void>
}

export class MemoryStore implements Store {
  private readonly state: StoreState

  constructor() {
    this.state = {
      plans: {},
      runs: {},
      events: {},
      documents: {},
      idempotency: {},
    }
  }

  async getPlan(id: string): Promise<MindMapPlan | undefined> {
    return this.state.plans[id]
  }

  async listAllPlans(): Promise<MindMapPlan[]> {
    return Object.values(this.state.plans)
  }

  async listPlans(ownerId: string): Promise<MindMapPlan[]> {
    return Object.values(this.state.plans).filter((plan) => plan.ownerId === ownerId)
  }

  async savePlan(plan: MindMapPlan): Promise<void> {
    this.state.plans[plan.id] = plan
  }

  async getRun(id: string): Promise<MindMapRun | undefined> {
    return this.state.runs[id]
  }

  async listRuns(planningId: string): Promise<MindMapRun[]> {
    return Object.values(this.state.runs).filter((run) => run.planningId === planningId)
  }

  async saveRun(run: MindMapRun): Promise<void> {
    this.state.runs[run.id] = run
  }

  async appendEvent(event: MindMapEvent): Promise<void> {
    this.state.events[event.planningId] = [...(this.state.events[event.planningId] ?? []), event]
  }

  async listEvents(planningId: string): Promise<MindMapEvent[]> {
    return [...(this.state.events[planningId] ?? [])]
  }

  async getDocument(id: string): Promise<MindMapDocument | undefined> {
    return this.state.documents[id]
  }

  async saveDocument(document: MindMapDocument): Promise<void> {
    this.state.documents[document.id] = document
  }

  async getIdempotency(
    ownerId: string,
    key: string,
  ): Promise<{ planningId: string; runId: string } | undefined> {
    return this.state.idempotency[`${ownerId}:${key}`]
  }

  async saveIdempotency(
    ownerId: string,
    key: string,
    value: { planningId: string; runId: string },
  ): Promise<void> {
    this.state.idempotency[`${ownerId}:${key}`] = value
  }
}
