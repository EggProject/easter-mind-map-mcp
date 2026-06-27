import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type {
  ExportArtifact,
  MindMapDocument,
  MindMapEvent,
  MindMapPlan,
  MindMapRun,
} from './types'

interface StoreState {
  plans: Record<string, MindMapPlan>
  runs: Record<string, MindMapRun>
  events: Record<string, MindMapEvent[]>
  documents: Record<string, MindMapDocument>
  exports: Record<string, ExportArtifact>
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
  saveExport(key: string, artifact: ExportArtifact): Promise<void>
  getExport(key: string): Promise<ExportArtifact | undefined>
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

export class FileStore implements Store {
  private readonly filePath: string
  private state?: StoreState
  private writes = Promise.resolve()

  constructor(dataDir: string) {
    this.filePath = join(dataDir, 'state.json')
  }

  async getPlan(id: string): Promise<MindMapPlan | undefined> {
    return (await this.load()).plans[id]
  }

  async listAllPlans(): Promise<MindMapPlan[]> {
    return Object.values((await this.load()).plans)
  }

  async listPlans(ownerId: string): Promise<MindMapPlan[]> {
    return Object.values((await this.load()).plans).filter((plan) => plan.ownerId === ownerId)
  }

  async savePlan(plan: MindMapPlan): Promise<void> {
    const state = await this.load()
    state.plans[plan.id] = plan
    await this.persist()
  }

  async getRun(id: string): Promise<MindMapRun | undefined> {
    return (await this.load()).runs[id]
  }

  async listRuns(planningId: string): Promise<MindMapRun[]> {
    return Object.values((await this.load()).runs).filter((run) => run.planningId === planningId)
  }

  async saveRun(run: MindMapRun): Promise<void> {
    const state = await this.load()
    state.runs[run.id] = run
    await this.persist()
  }

  async appendEvent(event: MindMapEvent): Promise<void> {
    const state = await this.load()
    state.events[event.planningId] = [...(state.events[event.planningId] ?? []), event]
    await this.persist()
  }

  async listEvents(planningId: string): Promise<MindMapEvent[]> {
    return [...((await this.load()).events[planningId] ?? [])]
  }

  async getDocument(id: string): Promise<MindMapDocument | undefined> {
    return (await this.load()).documents[id]
  }

  async saveDocument(document: MindMapDocument): Promise<void> {
    const state = await this.load()
    state.documents[document.id] = document
    await this.persist()
  }

  async saveExport(key: string, artifact: ExportArtifact): Promise<void> {
    const state = await this.load()
    state.exports[key] = artifact
    await this.persist()
  }

  async getExport(key: string): Promise<ExportArtifact | undefined> {
    return (await this.load()).exports[key]
  }

  async getIdempotency(
    ownerId: string,
    key: string,
  ): Promise<{ planningId: string; runId: string } | undefined> {
    return (await this.load()).idempotency[`${ownerId}:${key}`]
  }

  async saveIdempotency(
    ownerId: string,
    key: string,
    value: { planningId: string; runId: string },
  ): Promise<void> {
    const state = await this.load()
    state.idempotency[`${ownerId}:${key}`] = value
    await this.persist()
  }

  private async load(): Promise<StoreState> {
    if (this.state) return this.state
    try {
      this.state = JSON.parse(await readFile(this.filePath, 'utf8')) as StoreState
    } catch {
      this.state = {
        plans: {},
        runs: {},
        events: {},
        documents: {},
        exports: {},
        idempotency: {},
      }
    }
    return this.state
  }

  private async persist(): Promise<void> {
    const state = this.state
    if (!state) return
    this.writes = this.writes.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true })
      await writeFile(this.filePath, JSON.stringify(state, null, 2))
    })
    await this.writes
  }
}
