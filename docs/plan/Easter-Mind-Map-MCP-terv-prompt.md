# Easter Mind Map MCP — Fejlesztési Terv‑Prompt (multi‑agent)

> **Cél:** Ez a dokumentum egy önállóan futtatható **terv‑prompt**. Egy következő session‑ben egy **agent‑csapat** ezt kapja kontextusként, és ennek alapján fejleszti le az Easter Mind Map MCP szervert és a kapcsolódó upstream módosításokat.
>
> **Verziózott alap:** 2026‑06‑26‑i állapot. Stack‑döntések és protokoll‑verziók a fejlesztés első napján **újra‑verifikálandók** (lásd 19. fejezet).
>
> **Nyelv:** A csapat belső munkanyelve magyar, de minden kód, azonosító, MCP tool‑név, tool‑leírás és commit angol.

---

## 0. Hogyan használd ezt a dokumentumot — az Orchestrátornak szól

Te vagy az **Orchestrátor (Tech Lead) agent**. A te feladatod nem kódot írni, hanem:

1. Beolvasni ezt a tervet, és felépíteni belőle a munkamenet feladatlistáját (task graph) a 6. fejezet fázis‑DAG‑ja szerint.
2. Spawnolni a 5. fejezetben definiált **specializált subagenteket**, mindegyiknek átadni a saját szekcióját + a 3. fejezet upstream kontraktusát + a 2. fejezet globális szabályait.
3. Karbantartani a **megosztott szerződés‑dokumentumokat** (`docs/UPSTREAM-CONTRACT.md`, `docs/MCP-TOOLS.md`, `docs/ADR/*`), amelyekre minden agent hivatkozik.
4. Betartatni a **fázis‑kapukat (gates)**: egy fázis csak akkor zár, ha a 17. fejezet elfogadási kritériumai teljesülnek és a 16. fejezet tesztjei zöldek.
5. A végén lefuttatni a **19. fejezet verifikációs protokollját**: web‑kereséses tény‑ellenőrzés + független subagent teljesség‑ellenőrzés a 18. fejezet traceability mátrixa ellen.

**Nagyon fontos working‑agreement:** ne kezdj kódolni a 3. fejezet upstream kontraktusának **újra‑verifikálása** előtt. A kontraktus alább megadott állapota valós kódból származik (2026‑06), de a repo aktív — a Reverse‑Engineering agent első dolga visszaigazolni vagy frissíteni.

---

## 1. Küldetés és kontextus

A [MindGeniusAI](https://github.com/xianjianlf2/MindGeniusAI) egy nyílt forrású, AI‑alapú mind‑map generáló alkalmazás (monorepo: React webapp + Hono szerver + megosztott protokoll csomag). A szerver egy **stateless, párhuzamosan hívható** generáló engine: minden HTTP kéréshez külön agent‑futtatást indít, és Server‑Sent Events (SSE) stream‑ben adja vissza az eredményt.

**A feladat:** Építs egy **TypeScript‑alapú MCP szervert**, amely **kizárólagos integrációs rétegként** a MindGeniusAI HTTP/SSE backendje elé épül. Az MCP kliens (Hermes, Claude Code vagy bármely MCP host) **soha ne hívja közvetlenül** a MindGeniusAI API‑t — minden művelet MCP **toolokon** és **resource‑okon** keresztül történjen.

Az MCP szerver hozzáadott értéke a stateless engine fölé:

```text
MCP tool interfész
+ explicit, tartós planningId / runId / documentId
+ perzisztens állapot (terv, run, esemény, dokumentum)
+ job queue + concurrency limit
+ MindGeniusAI SSE feldolgozás és mind‑map állapot‑reducer
+ dokumentum‑koordináció (upload + RAG index)
+ cancellation + retry + idempotencia
+ OPML/PNG export + AI‑olvasható flow‑leírás
+ biztonság (ownership, auth, SSRF/quota)
+ upstream felügyelet (health‑check + auto‑start)
```

Külön cél (az upstream repón, nem az MCP szerveren): **MiniMax provider** opcionális bekötése config alapján (a gyári providerek megtartásával), és egy **Claude Code CLI** integráció, amelyet **szigorúan tmux‑szal** vezérlünk.

---

## 2. Globális elvek és nem‑alku‑tárgyalható szabályok

Ezek minden agentre kötelezőek. Bármelyik megsértése blokkolja a fázis‑zárást.

### 2.1 Stack és eszközlánc (a mind map „stack" ágából)
- **Runtime / package manager / test runner: Bun kötelező.** Az MCP szerver Bunon fut, Bunnal épül és `bun test`‑tel tesztel. (Az upstream MindGeniusAI Node+pnpm marad — ne keverd a kettőt.)
- **Nyelv: TypeScript 6.** A TS 6.0 stabil (2026‑03‑23 óta). Ezt használd. Ha a verifikáció során bármi blokkolná, esik vissza TS 5 LTS‑re. A kódot tartsd **TS 7 (Go‑natív fordító)‑kompatibilisre** (kerüld a kivezetésre ítélt feature‑öket).
- **Formázás: Prettier kötelező.**
- **Lint: ESLint** (flat config, `typescript-eslint`).
- **Git hooks: Lefthook kötelező.**
  - **pre‑commit:** ESLint **+** Prettier formázás a staged fájlokon.
  - **pre‑push:** unit tesztek (`bun test`).

### 2.2 MCP protokoll és SDK (2025‑2026 standard)
- **Baseline spec:** MCP **2025‑11‑25** (jelenlegi stabil produkciós verzió).
- **Előre‑kompatibilitás:** tervezz a **2026‑07‑28 Release Candidate** irányába (stateless core, Extensions framework, Tasks, MCP Apps, OAuth/OIDC‑közelített auth). **Ne** építs kizárólag a Tasks képességre — a tool‑alapú polling Tasks nélkül is teljesen működjön.
- **SDK:** hivatalos **MCP TypeScript SDK v1.x** produkcióhoz. A **v2** (várhatóan 2026 Q3) még fejlesztési ág — a kódot strukturáld v2‑migrálhatóra (transport/middleware réteg izolálva).

### 2.3 Tervezési alapelvek
- **Az állapot soha ne kötődjön az MCP transport session‑höz.** Használj explicit, szerver‑generált, kriptográfiailag erős azonosítókat: `planningId`, `runId`, `documentId`. Az MCP session ID legfeljebb transport‑technikai adat.
- **A tool‑ és paraméter‑szövegezés is prompt** (a mind map kulcs‑követelménye). A tool‑nevek, leírások és paraméter‑leírások úgy legyenek megírva, hogy az LLM **külön külső promptolás nélkül**, magától helyesen használja az MCP‑t. Ezt **tesztelni kell** (16. fejezet).
- **Token‑hatékonyság:** a státusz/lista toolok rövid metaadatot adjanak; a nagy tartalom (teljes mind map, eseménynapló) MCP **resource**‑ként, `resource_link`‑en keresztül érhető el.
- **SSE higiénia:** ne maradjanak nyitva felhalmozódó SSE kapcsolatok (a mind map explicit követelménye). Minden upstream stream `AbortController`‑hez kötött, és garantáltan lezárul `done`/`failed`/`cancel`/timeout/shutdown esetén.

### 2.4 A feltöltött „Specifikáció tervezet" státusza
A mind map `6191d4db` node‑jában lévő spec‑tervezet **referencia, nem alap**. A benne lévő **jó ötleteket átvesszük**, de 2025‑2026 standardokra frissítve és a valós upstream kontraktushoz igazítva (3. fejezet). Ahol a spec‑tervezet eltér a valóságtól, a **valós kód** az irányadó.

---

## 3. Igazolt upstream kontraktus — a MindGeniusAI valós állapota

> Ez a szekció valós forráskódból visszafejtett tény. A Reverse‑Engineering agent **első feladata ezt visszaigazolni / frissíteni** és belőle elkészíteni a `docs/UPSTREAM-CONTRACT.md` autoritatív dokumentumot. **Ne a spec‑tervezet feltételezéseiből indulj ki — ebből.**

### 3.1 Repo és stack
- `xianjianlf2/MindGeniusAI`, publikus, **MIT** licenc, default branch `main`, aktívan karbantartott (van friss `docs/REFACTOR_PLAN.md`).
- Monorepo, **pnpm workspaces**: `apps/web` (**React 18 + Vite + Zustand 5**, canvas = **AntV X6**), `apps/server` (**Hono**, **Node ≥ 20**, `tsx`, **pino** logger), `packages/shared` (megosztott protokoll + mind‑map limitek).
- LLM réteg: **Vercel AI SDK v5** (`ai` ^5), provider csomagok `@ai-sdk/openai|anthropic|deepseek`.
- **Health endpoint LÉTEZIK:** `GET /api/health` → `{ ok: true }`. (A mind map „ha nincs health endpoint, csináljunk" kitétele tehát kielégített — csak pollozni kell.)

### 3.2 A fő generáló endpoint: `POST /api/agent`
Hono route, **zod**‑validált kérés (`agentRequestSchema`, strict; rossz payload → `400`). Kéréstörzs:

```ts
type AgentRequest = {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>; // .min(1)
  fileName?: string;          // egy korábban feltöltött + indexelt PDF neve (rag_query-hez)
  mindMap?: MindMapOutline;   // a canvas aktuális outline-ja (rekurzív { id, label, children? })
};
```

Minden kérésre **egyszer** lefut a `runHermas(request, cfg, onEvent)` (Vercel AI SDK `streamText`, `MAX_STEPS = 8`), és külön SSE választ ad. Az LLM config **request headerből** jön (`llmConfigFrom`).

### 3.3 SSE wire‑formátum (`apps/server/src/lib/sse.ts` + `packages/shared/src/protocol.ts`)
Minden SSE `data:` sor egy JSON envelope:

```ts
enum MessageStatus { PENDING = 'pending', DONE = 'done', FAILED = 'failed' }
interface SseEnvelope { status: MessageStatus; data?: string }
```

A strukturált agent‑eseményt a `pending.data` mező kódolja, `agent:` prefixszel:

```ts
const AGENT_EVENT_PREFIX = 'agent:';
// envelope.data === 'agent:' + JSON.stringify(agentEvent)
// dekódolás: prefix levágása után JSON.parse, különben null (legacy nyers token)
```

> A `/agent` endpoint strukturált eseményt rétegez a régi envelope‑ba; a legacy endpointok (`/chat`, `/document/query`) nyers tokent tesznek a `pending.data`‑ba prefix nélkül.

### 3.4 AgentEvent unió (igazolt, kódból)

| `type` | Mezők | Mikor keletkezik |
|---|---|---|
| `text` | `delta: string` | AI SDK `text-delta` |
| `tool-call` | `toolName, toolCallId, input` | AI SDK `tool-call` |
| `tool-result` | `toolName, toolCallId, output` | AI SDK `tool-result` |
| `mindmap-patch` | `ops: MindMapOp[]` | **szintetikus**: csak `mindmap_edit` tool‑callnál |
| `mindmap-set` | `markdown: string` | **szintetikus**: csak `mindmap_generate` tool‑resultnál |
| `step-finish` | – | AI SDK `finish-step` |
| `error` | `message: string` | AI SDK `error` |

Kulcs‑részlet: a `mindmap-set` és `mindmap-patch` a szerver által **injektált, determinisztikus** események — nem kell markdown‑t kikaparni a chat‑szövegből. A `mindmap_edit.execute` szerver‑oldalon csak nyugtát ad vissza; a tényleges patch **kliens‑oldalon** alkalmazódik a `mindmap-patch` eseményből.

```ts
type MindMapOp =
  | { op: 'add'; parentId: string; label: string }
  | { op: 'update'; id: string; label: string }
  | { op: 'remove'; id: string };
```

### 3.5 Agent toolok (upstream, `apps/server/src/agent/tools.ts`)
`mindmap_generate` (topic → ~3 szintű markdown), `node_expand` (egy node → 3 alpont), `mindmap_edit` (add/update/remove ops a meglévő térképen), `rag_query` (feltöltött PDF keresése). Tervezett, de még nincs: `web_search`.

### 3.6 Mind‑map markdown → outline parser (a „shared parser")
`apps/web/src/utils/convertMarkdown.ts` — `buildTree` / `buildMindMap`, `marked.lexer` alapú, **determinisztikus**. Node‑típusok: `'topic' | 'topic-branch' | 'topic-child'`. Limitek (`MINDMAP_LIMITS`): `maxDepth: 5`, `maxNodes: 300`, `maxLabel: 200`. A `patch.ts` tartalmazza az `applyOps` (add/update/remove, defenzív: ismeretlen id/gyökér‑törlés némán kihagyva) és `toOutline` függvényeket.

> **MCP következmény:** ezt a parsert **determinisztikusan újra kell használni / portolni** az MCP szerverbe (ideálisan a `packages/shared`‑be kiemelve), hogy a `mindmap-set` markdownjából a szerver ugyanazt az outline‑t állítsa elő, mint a webapp.

### 3.7 RAG / dokumentum folyamat (`apps/server/src/services/rag.ts`)
- **In‑process memória index** (`Map<fileName, IndexedChunk[]>`), **nem perzisztens** (restart után elveszik), instance‑hez kötött.
- Folyamat: `POST /api/uploadFile` (multipart, **csak PDF**, ≤ 10 MB) → `POST /api/document/init { fileName }` (pdf‑parse → chunkolás → `embedMany`) → a `fileName`‑t átadva a `/api/agent` kérésben működik a `rag_query`.
- **Idempotencia:** `init` korán visszatér, ha a `fileName` már indexelt (nincs újra‑embedding). **LRU‑szerű eviction** `maxIndexedDocs` (default 20) felett. **Nincs** tartalom‑hash dedup különböző fájlnevek között (minden upload friss UUID nevet kap).

### 3.8 LLM providerek és konfiguráció
- Logikai providerek: `openai` (default `gpt-4o-mini`), `anthropic` (default `claude-sonnet-4-6`), `deepseek`, `moonshot` (Kimi, OpenAI‑kompatibilis útvonalon). **MiniMax jelenleg nincs.**
- Per‑request config (header > env): `X-LLM-Provider`, `Authorization: Bearer sk-...` (csak `sk-` prefixű kulcs), `OpenAI-proxy` (base URL), `X-LLM-Model`. Minden OpenAI‑kompatibilis út `.chat(model)`‑t kényszerít (`/v1/chat/completions`).
- Embedding csak OpenAI‑kompatibilis; ha nincs, a `rag_query` szépen degradál.

### 3.9 Export valóság
A PNG/JPEG/SVG export jelenleg **kliens‑oldali** AntV X6 funkció (`@antv/x6-plugin-export`). **OPML** nincs. → Az MCP export (12. fejezet) headless megoldást igényel (lásd a PNG export‑döntést).

### 3.10 Auth / statelessness (MCP‑relevancia)
Nincs szerver‑oldali auth/session/cookie; **bring‑your‑own‑key** per request, headerben. A `/agent` requestek közt **stateless** — a `messages[]`‑et és a `mindMap` outline‑t minden híváskor újra kell küldeni. Az egyetlen stateful elem a RAG index (in‑process, fileName‑kulcsú, instance‑affinitás kell).

---

## 4. Cél‑architektúra — az MCP adapter

```text
            MCP host / LLM (Hermes, Claude Code, ...)
                         │  MCP tools + resources (stdio / Streamable HTTP)
                         ▼
        ┌──────────────────────────────────────────────┐
        │        Easter Mind Map MCP Server (Bun, TS6)   │
        │                                                │
        │  Transport réteg (stdio | Streamable HTTP+OAuth)│
        │  Tool handlerek (a "generáló endpointok")       │
        │  Resource szolgáltató (plans, events, exports)  │
        │  Planning / Run / Document / Event service      │
        │  Queue + concurrency limiter (per global/owner/plan)│
        │  Mind‑map state reducer (shared parser újrahasznosítva)│
        │  Upstream SSE kliens (AbortController, no‑leak)  │
        │  Upstream supervisor (health‑check + auto‑start) │
        │  Persistent store (Postgres) + queue backend     │
        │  Security (ownership, SSRF, rate‑limit, secrets) │
        │  Export motor (OPML determinisztikus, PNG headless)│
        └──────────────────────────────────────────────┘
                         │  HTTP + SSE
                         ▼
              MindGeniusAI server (Hono, Node) — VÁLTOZATLAN upstream
              POST /api/agent · /api/uploadFile · /api/document/init · GET /api/health
```

Az MCP szerver **adapterként** épül a MindGeniusAI elé, és **nem módosítja** annak generáló forráskódját (kivéve a 14. fejezet explicit upstream‑módosításait, amelyek külön scope‑ban élnek).

---

## 5. Az agent‑csapat — szerepek, felelősségek, átadások

Az Orchestrátor a következő specializált subagenteket spawnolja. Mindegyik kap: a saját szekcióját, a 3. fejezet kontraktusát, a 2. fejezet szabályait, és a megosztott `docs/` szerződéseket.

| Agent | Felelősség | Fő kimenet | Függ |
|---|---|---|---|
| **A0 — Orchestrátor / Tech Lead** | Koordináció, task graph, fázis‑kapuk, ADR‑ek, végső verifikáció | `docs/ADR/*`, task graph, release | – |
| **A1 — Reverse‑Engineering & Contract** | A 3. fejezet visszaigazolása/frissítése; server↔webapp flow precíz dokumentálása | `docs/UPSTREAM-CONTRACT.md` | – |
| **A2 — MCP Core & Tool‑design** | MCP szerver váz, transportok, tool‑definíciók, *szövegezés‑mint‑prompt*, resource‑ok, MCP instructions | `src/mcp/**`, `docs/MCP-TOOLS.md` | A1 |
| **A3 — Upstream SSE kliens & reducer** | AgentRequest összeállítás, SSE parse, AgentEvent decode, mind‑map reducer, **SSE no‑leak**, **health‑check + auto‑start** | `src/upstream/**`, `src/workers/**` | A1 |
| **A4 — State, Queue & Concurrency** | Perzisztencia (plan/run/event/document), idempotencia, verziózás, queue, concurrency limitek, cancellation | `src/application/**`, `src/persistence/**`, `src/queue/**` | A2, A3 |
| **A5 — Export & Flow** | `mindmap_export` (OPML+PNG), `mindmap_guide` flow‑endpoint/resource | `src/export/**`, flow resource | A2, A4 |
| **A6 — Security & Ownership** | ownership minden entitáson, OAuth 2.1/bearer (HTTP), SSRF/path/size védelem, rate‑limit/quota, secret‑kezelés | `src/security/**` | A2, A4 |
| **A7 — Upstream Modifications** | `./original-MindGeniusAI`: MiniMax provider (config‑bound, gyári megtartva) + Claude Code CLI (tmux‑only) | upstream PR‑ek | A1 |
| **A8 — DevOps / Tooling** | Bun projekt, TS6 config, Prettier, ESLint, Lefthook (pre‑commit/pre‑push), CI | repo‑bootstrap, `lefthook.yml`, CI | – |
| **A9 — QA & Verification** | unit/integration tesztek, **tool‑autonómia eval**, elfogadási kritériumok, SSE‑leak audit, teljesség‑ellenőrzés | tesztek, QA riport | mind |

**Átadási elv:** minden agent a megosztott `docs/` szerződéseken keresztül kommunikál; tool‑ vagy adatszerződés‑változás csak ADR‑rel és A0 jóváhagyással.

---

## 6. Fázisterv és függőségek (DAG)

| Fázis | Tartalom | Vezető agentek | Belépő feltétel | Kilépő kapu (gate) |
|---|---|---|---|---|
| **F0 — Bootstrap & Contract** | Repo‑váz (Bun/TS6/Prettier/ESLint/Lefthook/CI); upstream kontraktus visszaigazolása | A8, A1 | – | `docs/UPSTREAM-CONTRACT.md` kész; `bun test` + hookok futnak |
| **F1 — Upstream kliens & MCP váz** | SSE kliens + reducer + health/auto‑start; MCP szerver váz + transportok | A3, A2 | F0 | Egy valós `/api/agent` futás végig‑streamel, az outline determinisztikus; **nincs SSE‑leak** |
| **F2 — Toolok, state, konkurrencia** | Generáló toolok; perzisztencia; queue; concurrency; idempotencia; verziózás | A2, A4 | F1 | `mindmap_create` azonnal ad `planningId`‑t; párhuzamos tervek; plan‑szintű soros futás |
| **F3 — Dokumentum, export, flow, security** | document add/index; `mindmap_export` (OPML/PNG); `mindmap_guide`; ownership/auth/SSRF/quota | A4, A5, A6 | F2 | Export működik; flow‑endpoint AI‑olvasható; minden entitáson ownership |
| **F4 — Upstream módosítások** | MiniMax provider (config); Claude Code CLI (tmux) | A7 | F0 (parallel F1‑F3 mellett) | Gyári provider változatlan; MiniMax configból; CLI csak tmux‑szal |
| **F5 — Hardening & QA** | Tesztek, tool‑autonómia eval, acceptance, SSE‑leak audit, dokumentáció | A9 + mind | F2–F4 | A 17. fejezet összes kritériuma zöld; 19. fejezet verifikáció kész |

**Függőségi megjegyzések:** F4 (upstream módosítások) F0 után **párhuzamosan** futhat F1‑F3‑mal, mert külön kódbázis. F3 export függ a reducer outline‑jától (F1) és a perzisztált állapottól (F2). F5 mindent zár.

---

## 7. MCP toolok — a „generáló endpointok"

> **A mind map kritikus elve (`da8b1292`):** minden tool‑név, leírás és paraméter‑leírás **prompt**. Úgy írd meg őket, hogy az LLM **külső magyarázat nélkül**, magától helyesen hívja láncba. Minden tool‑leírás tartalmazzon: mit csinál, mikor hívd, mit **ne**, mi a következő lépés (`nextAction`). A szövegezést a 16. fejezet eval‑ja validálja.

A baseline tool‑készlet (a spec‑tervezet jó ötletei, a valós kontraktushoz igazítva):

### 7.1 `mindmap_create`
Új tervezést hoz létre és queue‑ba teszi az első futást. **Gyorsan visszatér**, nem tartja nyitva a tool‑callt a teljes generálásig.

```ts
type MindmapCreateInput = {
  prompt: string;                 // mit tervezzen meg a mind map
  documentId?: string;            // korábban hozzáadott + indexelt dokumentum (RAG)
  initialMindMap?: MindMapOutline;
  idempotencyKey?: string;        // azonos principal + key ne indítson duplikált tervet
  metadata?: Record<string, string>;
};
type MindmapCreateOutput = {
  planningId: string;             // kriptográfiailag erős, nem prediktálható
  runId: string;
  status: 'queued' | 'running';
  resourceUri: string;            // mindmap://plans/{planningId}
  nextAction: 'call mindmap_get_status with this planningId';
};
```

### 7.2 `mindmap_continue`
Meglévő tervet folytat. A szerver betölti a korábbi `messages` + aktuális `mindMap` állapotot, hozzáfűzi az új utasítást, és új `POST /api/agent` kérést indít. **Egy `planningId` alatt egyszerre legfeljebb egy módosító run**; különböző `planningId`‑k párhuzamosan futhatnak.

```ts
type MindmapContinueInput = { planningId: string; instruction: string; idempotencyKey?: string };
type MindmapContinueOutput = { planningId: string; runId: string; status: 'queued' | 'running' };
```

### 7.3 `mindmap_get_status`
Rövid, token‑hatékony állapot. **Ne** adja vissza a teljes térképet vagy eseménynaplót.

```ts
type MindmapGetStatusOutput = {
  planningId: string; currentRunId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: { completedSteps: number; lastEventType?: string };
  updatedAt: string; error?: string; resultResourceUri?: string;
};
```

### 7.4 `mindmap_get_result`
Az aktuális vagy végleges eredmény. Nagy eredménynél **csak összefoglaló + `resource_link`**.

```ts
type MindmapGetResultInput = { planningId: string; format?: 'outline' | 'markdown' | 'summary' };
type MindmapGetResultOutput = {
  planningId: string; status: string; version: number;
  mindMap?: MindMapOutline; markdown?: string; summary?: string; resourceUri: string;
};
```

### 7.5 `mindmap_cancel`
Megszakítja az aktív vagy queue‑ban várakozó futást: queued → törlés; running → a hozzá tartozó `AbortController` abort. Státusz `cancelled`. A legutóbbi commitolt verzió olvasható marad; részleges run **nem** írja felül.

### 7.6 `mindmap_list`
A callerhez tartozó tervek lapozott listája (rövid metaadat: `status?`, `cursor?`, `limit?`).

### 7.7 `mindmap_document_add`
PDF regisztrálása és továbbítása a MindGeniusAI `POST /api/uploadFile`‑jának. **Biztonsági szabályok (6.):** `local_path` csak stdio/local deploymentnél, konfigurált gyökérmappa alatt; remote MCP‑nél kontrollált `resource_uri`; nincs tetszőleges URL‑letöltés SSRF‑védelem nélkül; nagy fájl tartalma **ne** menjen base64‑ként az LLM kontextusán át.

```ts
type MindmapDocumentAddInput = {
  source: { type: 'local_path'; path: string } | { type: 'resource_uri'; uri: string };
  displayName?: string;
};
type MindmapDocumentAddOutput = { documentId: string; upstreamFileName: string; status: 'uploaded' };
```

### 7.8 `mindmap_document_index`
RAG‑indexelést indít (`POST /api/document/init`). Ugyanarra a `documentId`‑ra egyszerre **csak egy** indexelés fusson (az upstream fileName‑idempotenciára építve, MCP‑oldali lockkal megerősítve).

### 7.9 `mindmap_export` — *(új; mind map `8f7d0f98` + `b9eab9d1`)*
Külön export endpoint. Egy terv aktuális/commitolt verzióját exportálja.

```ts
type MindmapExportInput = { planningId: string; formats?: Array<'opml' | 'png' | 'markdown'> };
type MindmapExportOutput = {
  planningId: string; version: number;
  artifacts: Array<{ format: 'opml' | 'png' | 'markdown'; resourceUri: string; bytes?: number }>;
};
```
A nagy bináris (PNG) **resource_link**‑ként térjen vissza, ne inline. Lásd a PNG export‑döntést (12.).

### 7.10 `mindmap_guide` — *(új; mind map `0f8287b7`)*
**Flow‑magyarázó endpoint.** Tömör, AI‑olvasható leírást ad arról, hogyan kell a generáló MCP toolokat helyes sorrendben hívni — a dokumentált upstream folyamat + a megtervezett MCP toolok alapján —, és **kötelezően azzal zár, hogy a végén exportálni kell OPML és PNG formátumba** (`mindmap_export`). Ez tool **és** resource is lehet (`mindmap://guide`). Tartalma egy determinisztikus „recept", pl.:

```text
1) mindmap_create(prompt[, documentId])  -> jegyezd meg a planningId-t
2) ismételd: mindmap_get_status(planningId) amíg status ∈ {completed, failed}
3) finomításhoz: mindmap_continue(planningId, instruction) -> vissza a 2)-re
4) mindmap_get_result(planningId, format:'outline'|'markdown')
5) KÖTELEZŐ ZÁRÁS: mindmap_export(planningId, formats:['opml','png'])
Szabály: soha ne találd ki vagy módosítsd a planningId/runId/documentId értékeket.
```

### 7.11 Upstream supervisor — *(belső; mind map `4d33843a`)*
Nem feltétlenül LLM‑facing tool, hanem **belső middleware**: minden generáló hívás előtt ellenőrzi `GET /api/health`‑hel, hogy fut‑e az upstream; ha nem, **elindítja** (konfigurált parancs/process), és csak akkor enged tovább, amikor a health zöld (exponenciális backoff, timeout, max kísérlet). Opcionálisan kitehető egy `system_status` read‑only toolként is.

---

## 8. MCP resource‑ok

```text
mindmap://plans/{planningId}                application/json
mindmap://plans/{planningId}/outline        application/json
mindmap://plans/{planningId}/markdown       text/markdown
mindmap://plans/{planningId}/events         application/x-ndjson
mindmap://plans/{planningId}/runs/{runId}   application/json
mindmap://documents/{documentId}            application/json
mindmap://exports/{planningId}/opml         text/x-opml (application/xml)
mindmap://exports/{planningId}/png          image/png
mindmap://guide                             text/markdown
```

Minden tool‑eredmény tartalmazza a releváns resource URI‑t, hogy az LLM csak szükség esetén olvassa be a nagy tartalmat.

---

## 9. Perzisztált adatmodell, queue és konkurrencia

### 9.1 Adatmodell

```ts
type PlanningStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

type MindMapPlan = {
  id: string; ownerId: string; status: PlanningStatus; version: number; // monoton növekvő
  messages: AgentMessage[]; mindMap?: MindMapOutline; markdown?: string;
  documentId?: string; metadata: Record<string, string>; createdAt: string; updatedAt: string;
};
type MindMapRun = {
  id: string; planningId: string; status: PlanningStatus; instruction: string;
  startedAt?: string; completedAt?: string; retryCount: number; error?: string;
};
type MindMapEvent = {
  id: string; planningId: string; runId: string; sequence: number; type: string; payload: unknown; createdAt: string;
};
type MindMapDocument = {
  id: string; ownerId: string; upstreamFileName: string; originalName?: string;
  status: 'uploaded' | 'indexing' | 'indexed' | 'failed'; createdAt: string;
};
```

### 9.2 Tárolás (ajánlás + alternatívák — a user „jó ötletek + modern" döntése szerint)
- **Durable állapot: PostgreSQL** (plan, run, message, event, idempotency, ownership). Bun 1.3 natív Postgres kliense kihasználható.
- **Queue:** *Ajánlott alternatíva* a Redis‑függőség elkerülésére: **Postgres‑alapú queue** (pl. `pg-boss`) — egy adatbázis, egyszerűbb ops. *Eredeti spec‑ötlet:* **BullMQ (Redis)**, ha úgyis kell Redis cache/pub‑sub. ADR‑ben döntsd el.
- **Dokumentumok:** objektumtároló vagy kontrollált fájlrendszer.
- **Processzmemória:** csak rövid életű `AbortController` + aktív worker referencia.

### 9.3 Concurrency config

```ts
type ConcurrencyConfig = {
  maxConcurrentRunsGlobal: number;
  maxConcurrentRunsPerOwner: number;
  maxConcurrentRunsPerPlanning: 1;   // FIX: plan‑szinten soros
  maxConcurrentDocumentIndexes: number;
  upstreamRequestTimeoutMs: number;
  maxRetries: number;
};
```

Szabályok: (1) különböző `planningId`‑k párhuzamosan; (2) azonos `planningId` módosító runjai sorban; (3) dokumentum‑indexelés külön queue; (4) backpressure; (5) `429`/átmeneti `5xx` → exponenciális backoff; (6) **konfiguráció nélküli korlátlan párhuzamosság tilos**. A tényleges kapacitást az LLM‑provider limit, a Bun memória, a nyitott SSE kapcsolatok és az embedding terhelés szabja meg.

---

## 10. Konzisztencia, idempotencia, retry, cancellation

**Verziózás / optimista zár:** run indulásakor `baseVersion = plan.version`, `workingSnapshot = clone(plan)`. Commit csak ha `plan.version === baseVersion`; különben concurrency conflict, a run nem írja felül az újabb állapotot. (A plan‑szintű soros queue az elsődleges védelem, a version check a második.)

**Idempotencia:** azonos principal + `idempotencyKey` ugyanazt az eredeti műveletet jelenti; ne indítson duplikált tervet/runt.

**Retry (csak biztonságosan):** kapcsolatfelépítési hiba, upstream timeout az **első érdemi esemény előtt**, `429`, átmeneti `502/503/504`. **Ne** retry‑olj olyan futást, amely már dolgozott fel mind‑map eseményt. Minden run izolált working snapshotot használ; partial eventek nem kerülnek a commitolt állapotba; retry új `runId`‑val vagy növelt attempttel.

**Cancellation / shutdown:** minden aktív runhoz `AbortController`. Leállításkor: ne fogadj új jobot; jelezd a worker shutdownt; abortáld/kontrolláltan zárd az upstream streameket; a félbemaradt runok `failed`/`interrupted`; később a queue‑policy szerint újrapróbálhatók; a legutóbbi commitolt verzió sértetlen.

---

## 11. Upstream SSE kliens és esemény‑reducer

Minden runhoz a worker:

```text
1. betölti a plan aktuális állapotát (messages + mindMap outline);
2. összeállítja az AgentRequest payloadot (+ a megfelelő LLM header configot);
3. POST /api/agent AbortSignal-lal;
4. parse-olja az SSE envelope frame-eket;
5. decode-olja a pending.data 'agent:'-prefixű AgentEvent-jét (különben legacy token);
6. sequence-helyesen tárolja az eseményeket (MindMapEvent);
7. working snapshoton alkalmazza a mind-map változásokat;
8. SSE status=done -> atomikus verzió-commit;
9. SSE status=failed / abort -> nem commitolt snapshot eldobása (rollback).
```

**Esemény‑reducer (a 3.4 unió szerint):**

```text
text          -> append az aktuális assistant message-hez
tool-call     -> audit event (mindmap_edit input.ops -> a mindmap-patch forrása)
tool-result   -> audit event (mindmap_generate output -> a mindmap-set forrása)
mindmap-set   -> a teljes working térkép cseréje; a markdown -> outline a SHARED parserrel (3.6)
mindmap-patch -> add/update/remove node ID alapján (applyOps szemantika, defenzív)
step-finish   -> progress.completedSteps++
error         -> run failed
```

**SSE no‑leak követelmény (`df7fc653`):** runonként **egyetlen** upstream SSE kapcsolat, `AbortController`‑hez kötve; garantált lezárás `done`/`failed`/`cancel`/timeout/shutdown esetén; idle‑ és max‑életkor timeout; a concurrency limit megakadályozza a kapcsolat‑felhalmozódást. **A QA‑nak (16.) explicit leak‑auditja van:** terhelés alatt a nyitott socketek száma stabilizálódjon, és a futások után 0‑ra essen.

---

## 12. Export (OPML + PNG) és a flow‑endpoint

**OPML:** determinisztikusan generálható az outline‑ból (`<outline text="...">` fa). Tedd `packages/shared`‑be tiszta függvényként, unit‑tesztelve.

**PNG — design döntés (ADR kötelező), mert az upstream export kliens‑oldali (3.9):**
- **(A) Headless render az AntV X6 export újrahasználatával** — legmagasabb fidelity, de fejléc‑nélküli böngészőt igényel (pl. Playwright/Chromium). Nehezebb ops, de pixelpontos a webappal.
- **(B) Determinisztikus szerver‑oldali layout** (pl. ELK/`d3-flextree`) → SVG → raszterizálás böngésző nélkül (`resvg`/`sharp`). Tiszta headless, könnyebb ops, kicsit eltérő vizuál.
- *Ajánlás:* **(B)** az MCP headless tisztaságáért, **(A)** mint fidelity‑fallback, ha pixelpontos egyezés kell. Döntsd el ADR‑ben.

**Flow‑endpoint (`mindmap_guide`, 7.10):** a dokumentált folyamat + a megtervezett MCP toolok AI‑olvasható receptje, amely **kötelezően OPML+PNG exporttal zár**.

---

## 13. Biztonság

- Minden `plan`, `run`, `document` rendelkezzen `ownerId`‑vel; minden tool ellenőrizze, hogy a caller hozzáfér‑e a megadott `planningId`‑hez. A `planningId` **önmagában ne** legyen jogosultsági token.
- **Ne** fogadj MindGeniusAI base URL‑t tool‑argumentumból — az upstream URL configból + allowlistből jöjjön.
- **Ne** fogadj LLM‑provider API kulcsot normál tool‑argumentumból — titkok env/secret managerből.
- Dokumentum‑URI: SSRF‑, path‑traversal‑ és méret‑védelem.
- Owner‑alapú **rate‑limit + quota**.
- Naplózáskor **ne** kerüljön ki API kulcs vagy teljes érzékeny dokumentumtartalom.
- **Központi (Streamable HTTP) deploy:** `OAuth 2.1 / bearer auth + owner isolation` (a 2026‑07‑28 RC OAuth/OIDC‑közelítésével kompatibilisen). Az MCP transport session és a `planningId` **két külön fogalom**.

### Javasolt MCP szerver `instructions`
```text
This server manages persistent MindGeniusAI mind-map plans.
Always call mindmap_create to start a new plan and preserve the returned planningId exactly.
Use mindmap_get_status for progress checks.
Use mindmap_get_result only when completed or when the current snapshot is explicitly needed.
Use mindmap_continue with the same planningId to modify an existing plan.
Finish a finished plan by calling mindmap_export with ['opml','png'].
Never invent or alter planningId, runId, or documentId values.
Do not start multiple concurrent continuations for the same planningId.
```

---

## 14. Upstream módosítások — `./original-MindGeniusAI`

> Ez **külön scope** az MCP szervertől, és a **valós upstream kódbázison** (Hono + Node + Vercel AI SDK v5 + pnpm) történik. A módosítások ne törjék a gyári viselkedést.

### 14.1 MiniMax provider (config‑bound; gyári megtartva) — mind map `3ad19c57`
A gyári providerek (openai/anthropic/deepseek/moonshot) **maradjanak változatlanok**. Adj hozzá egy új, **konfigból kapcsolható** MiniMax providert:

- Új `ProviderName` érték: `'minimax'`.
- `config.providers.minimax` blokk + a `chatModel(...)` switch egy `'minimax'` ága.
- **MiniMax OpenAI‑kompatibilis**, ezért a Moonshot‑mintára `createOpenAI({ baseURL, apiKey }).chat(model)` úton kösd be.
  - Default base URL: `https://api.minimax.io/v1` (chat completions az OpenAI `/v1/chat/completions` kontraktust tükrözi).
  - Env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL` (pl. `MiniMax-M2` / `MiniMax-M2.x` / `MiniMax-M3` — a friss modellnév a fejlesztéskor verifikálandó a MiniMax dokumentációból).
  - Per‑request override a meglévő header‑mintát kövesse (`X-LLM-Provider: minimax`).
- Embeddinghez a MiniMax nem feltétlenül ad OpenAI‑kompatibilis embedding modellt → a meglévő „embedding hiányában szépen degradál" logika maradjon érvényben (RAG opcionális MiniMaxnál).
- **Elfogadás:** a gyári provider választható és változatlan; MiniMax csak akkor aktív, ha configból be van kapcsolva; nincs regresszió a meglévő providereknél.

### 14.2 Claude Code CLI — szigorúan tmux‑szal — mind map `cd03da52`
Adj az upstreamhez egy **Claude Code CLI** integrációt a következő **kemény megkötésekkel**:

- **CSAK tmux‑szal** vezérelve (programozott `tmux new-session` / `send-keys` / `capture-pane` az interaktív `claude` session‑höz).
- **TILOS** az **Agent SDK** használata.
- **TILOS** a `claude -p` (print/headless) parancs használata.
- Az integráció determinisztikus: session életciklus (indítás, parancs‑injektálás, kimenet‑olvasás, leállítás), timeout‑ és hibakezelés, a tmux pane tartalmának strukturált kinyerése.
- **Elfogadás:** a CLI kizárólag tmux‑on át fut; statikus ellenőrzés/teszt igazolja, hogy nincs Agent SDK import és nincs `claude -p` hívás a kódban.

---

## 15. Fejlesztői eszközlánc (Bun, TS6, Prettier, ESLint, Lefthook)

- **Bun** monorepo/workspace (MCP szerver). Scriptek: `bun run build`, `bun test`, `bun run lint`, `bun run format`.
- **TypeScript 6** `tsconfig` (strict, `moduleResolution: bundler`/`nodenext` a transporttól függően). TS7‑portábilis kód.
- **Prettier** egységes konfig; **ESLint** flat config + `typescript-eslint`.
- **Lefthook** (`lefthook.yml`):

```yaml
pre-commit:
  parallel: true
  commands:
    eslint:
      glob: "*.{ts,tsx}"
      run: bunx eslint {staged_files}
    prettier:
      glob: "*.{ts,tsx,json,md,yml,yaml}"
      run: bunx prettier --write {staged_files}
      stage_fixed: true
pre-push:
  commands:
    unit-tests:
      run: bun test
```

- **CI:** ugyanezek a kapuk (lint + format‑check + `bun test`) PR‑en.

---

## 16. Tesztelés és a „tool‑autonómia" eval

- **Unit:** OPML generátor, markdown→outline parser (a 3.6 shared parser determinizmusa), reducer (3.4 minden eseménytípus), version/commit logika, idempotencia, retry‑döntés, security guardok.
- **Integráció:** valós (vagy mockolt) `/api/agent` SSE stream end‑to‑end; document upload→init→query; cancellation valóban abortálja az upstream streamet.
- **SSE‑leak audit:** terheléses futás alatt a nyitott socketek száma stabil, futások után 0.
- **Tool‑autonómia eval (a mind map `da8b1292` követelménye):** kösd be az MCP‑t egy MCP hostba, és **külön promptolás nélkül** adj feladatot („tervezz mind mapet X‑ről és exportáld"). Mérd, hogy az LLM a tool‑neveket/leírásokat olvasva **helyes láncot** hív (`create → status* → result → export`), nem talál ki ID‑kat, és a flow‑t a `mindmap_guide` szerint zárja. Ez **fázis‑kapu** F5‑ben; ha bukik, a tool‑szövegezést kell javítani, nem a hostot.

---

## 17. Elfogadási kritériumok (Definition of Done)

**MCP mag (a spec‑tervezet 15 pontja, frissítve):**
1. Az MCP kliens kizárólag MCP toolokon keresztül használja a MindGeniusAI‑t.
2. `mindmap_create` azonnal tartós `planningId`‑t ad.
3. Több különböző terv futhat párhuzamosan ugyanazon MCP szerveren.
4. Ugyanazon terv két módosítása nem futhat párhuzamosan.
5. Egy plan eseményei soha nem módosíthatják másik plan állapotát.
6. Teljes MCP‑ és worker‑restart után a planek visszatölthetők.
7. `mindmap_continue` a korábbi `messages` + aktuális `mindMap` alapján folytat.
8. A MindGeniusAI SSE minden dokumentált eseménytípusa kezelve van (3.4).
9. Partial/hibás run nem írja felül az utolsó commitolt verziót.
10. `mindmap_cancel` megszakítja az upstream HTTP/SSE futást (no‑leak).
11. A queue globális, owner‑ és plan‑szintű concurrency limitet alkalmaz.
12. Ugyanazon dokumentum párhuzamos indexelése csak egy upstream embedding‑futtatást indít.
13. Nagy eredmény MCP resource‑ként lekérhető.
14. Minden planhez/dokumentumhoz ownership‑ellenőrzés tartozik.
15. A megoldás MCP Tasks támogatása **nélkül is** teljesen működik.

**Új kritériumok (mind map kiegészítések):**
16. **Export:** `mindmap_export` OPML‑t és PNG‑t ad; nagy bináris resource_link‑ként.
17. **Flow:** `mindmap_guide` AI‑olvasható receptet ad, amely OPML+PNG exporttal zár.
18. **Server‑supervisor:** ha az upstream nem fut, az MCP elindítja és csak health‑zöld után enged generálni.
19. **SSE no‑leak:** a leak‑audit zöld.
20. **Tool‑autonómia eval** zöld (16.).
21. **Eszközlánc:** Bun + TS6 + Prettier + ESLint + Lefthook (pre‑commit eslint+prettier, pre‑push `bun test`) működik.
22. **Upstream MiniMax:** configból kapcsolható, gyári providerek változatlanok.
23. **Upstream Claude Code CLI:** csak tmux; nincs Agent SDK; nincs `claude -p` (statikusan igazolva).

---

## 18. Követelmény‑traceability mátrix (mind map → fedés)

> Az Orchestrátor és a QA agent ezt használja a **teljesség** bizonyítására. Minden eredeti mind‑map node ide van kötve.

| Mind map node (id) | Eredeti szöveg (kivonat) | Fedő fejezet(ek) |
|---|---|---|
| `3577c07d` | **MindGeniusAI MCP** (gyökér) | 1, 4 |
| `e1224492` | Vissza kell fejteni és dokumentálni a server API folyamatát; MCP‑ből szimulálni | 3, 5 (A1), F0 |
| `df7fc653` | Ne maradjon sok SSE kapcsolat | 2.3, 11 (no‑leak), 16 |
| `e4f30690` | **Endpoints** (csoport) | 7 |
| `da8b1292` | Endpoint+paraméter szövegezés = prompt; LLM magától használja, külön promptolás nélkül | 2.3, 7 (bevezető), 16 (eval) |
| `4d33843a` | Check, hogy fut‑e a server; ha nem, indítsa; HTTP liveness; health endpoint ha nincs | 7.11 (supervisor), 3.1 (health létezik), 17/18 |
| `401cdda4` | Server↔webapp feltérképezés + pontos dokumentáció az MCP endpoint‑tervhez | 3, 5 (A1), 6 (F0) |
| `0f8287b7` | Flow‑magyarázó endpoint; OPML+PNG export a végén | 7.10 (`mindmap_guide`), 12 |
| `8f7d0f98` | Export külön endpointtal | 7.9 (`mindmap_export`), 12 |
| `3c8fca45` | **stack** (csoport) | 2.1, 15 |
| `b9eab9d1` | Export endpointok támogatása | 7.9, 12, 17/16 |
| `2042127f` | TS6 ha lehet, különben TS5 LTS | 2.1, 15 |
| `ef158279` | Bun kötelező | 2.1, 15 |
| `f0c520bf` | Prettier kötelező | 2.1, 15 |
| `7b899ab5` | Lefthook kötelező | 2.1, 15 |
| `716014a4` | pre‑commit: eslint + prettier | 2.1, 15 |
| `85ae3795` | pre‑push: unit tesztek | 2.1, 15, 16 |
| `fd9a03f0` | `./original-MindGeniusAI` (csoport) | 14 |
| `ca9fa511` | módosítások (csoport) | 14 |
| `3ad19c57` | MiniMax provider configból, gyári megtartva | 14.1 |
| `cd03da52` | Claude Code CLI csak tmux; nincs Agent SDK; nincs `claude -p` | 14.2 |
| `6191d4db` | Specifikáció tervezet (referencia, nem alap) | 2.4 + beépítve 7–13 |

---

## 19. Verifikációs protokoll (web‑search + subagent dupla‑ellenőrzés)

A fejlesztés **első napján** és **release előtt** kötelező:

1. **Verzió‑verifikáció web‑kereséssel** (mert ezek változnak):
   - MCP spec aktuális stabil + RC státusz (baseline 2025‑11‑25; RC 2026‑07‑28).
   - MCP TypeScript SDK v1.x ↔ v2 státusz (produkció = v1.x).
   - TypeScript 6 (stabil 2026‑03) ↔ esetleges TS7 megjelenés.
   - Bun aktuális stabil (1.3.x sáv).
   - MiniMax OpenAI‑kompatibilis endpoint + aktuális modellnevek.
2. **Upstream kontraktus visszaigazolása:** az A1 agent a 3. fejezet minden állítását igazolja vissza a friss `main`‑ből; eltérés → ADR + e dokumentum frissítése.
3. **Független teljesség‑ellenőrzés subagenttel:** egy külön agent a **18. fejezet mátrixa** ellen ellenőrzi, hogy minden mind‑map node fedett az implementációban és a tesztekben. Hiányt blokkoló hibaként jelez.
4. **Tool‑autonómia eval** (16.) valós MCP hosttal.

---

## 20. Mellékletek — ellenőrzött források

**MindGeniusAI (valós kód):** `apps/server/src/routes/agent.ts`, `apps/server/src/agent/hermas.ts`, `apps/server/src/agent/tools.ts`, `apps/server/src/services/rag.ts`, `apps/server/src/lib/sse.ts`, `apps/server/src/llm/provider.ts`, `packages/shared/src/protocol.ts`, `apps/web/src/utils/convertMarkdown.ts`, `apps/web/src/utils/patch.ts`, `apps/web/src/api/sse.ts`, `docs/REFACTOR_PLAN.md` — forrás: https://github.com/xianjianlf2/MindGeniusAI

**MCP:** spec 2025‑11‑25 — https://modelcontextprotocol.io/specification/2025-11-25 · 2026‑07‑28 RC — https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/ · TS SDK — https://github.com/modelcontextprotocol/typescript-sdk

**Stack:** TypeScript 6.0 — https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/ · Bun — https://bun.com/ · Lefthook — https://lefthook.dev/ · MiniMax OpenAI‑kompatibilis API — https://platform.minimax.io/docs/api-reference/text-openai-api

---

*Készült: 2026‑06‑26. A terv‑prompt önállóan átadható egy következő session agent‑csapatának. Stack‑ és protokoll‑verziók a fejlesztés első napján újra‑verifikálandók (19. fejezet).*



