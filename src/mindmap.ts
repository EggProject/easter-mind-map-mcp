import type { AgentEvent, MindMapOp, MindMapOutline } from './types'

const LIMITS = {
  maxDepth: 5,
  maxNodes: 300,
  maxLabel: 200,
} as const

export interface ReducedRun {
  mindMap?: MindMapOutline
  markdown?: string
  assistantText: string
  completedSteps: number
  lastEventType?: string
  failedMessage?: string
}

export function reduceAgentEvent(state: ReducedRun, event: AgentEvent): ReducedRun {
  const next: ReducedRun = { ...state, lastEventType: event.type }
  if (event.type === 'text') {
    next.assistantText += event.delta
  } else if (event.type === 'mindmap-set') {
    next.markdown = event.markdown
    next.mindMap = buildMindMap(event.markdown) ?? next.mindMap
  } else if (event.type === 'mindmap-patch' && next.mindMap) {
    next.mindMap = cloneOutline(next.mindMap)
    applyOps(next.mindMap, event.ops)
  } else if (event.type === 'step-finish') {
    next.completedSteps += 1
  } else if (event.type === 'error') {
    next.failedMessage = event.message
  }
  return next
}

export function buildMindMap(markdown: string): MindMapOutline | null {
  const clean = unwrapFence(markdown)
  const lines = clean.split(/\r?\n/)
  const root: InternalNode = { id: newNodeId(), label: '', depth: 0, children: [] }
  const stack: InternalNode[] = [root]
  let firstPlainText: string | undefined

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      const depth = heading[1].length
      const node: InternalNode = {
        id: newNodeId(),
        label: clampLabel(heading[2]),
        depth,
        children: [],
      }
      while (stack.length > depth) stack.pop()
      stack[stack.length - 1]?.children.push(node)
      stack.push(node)
      continue
    }
    const item = /^[-*]\s+(.+)$/.exec(line)
    if (item) {
      const parent = stack[stack.length - 1] ?? root
      parent.children.push({
        id: newNodeId(),
        label: clampLabel(item[1]),
        depth: parent.depth + 1,
        children: [],
      })
      continue
    }
    firstPlainText ??= line.replace(/^#{1,6}\s*/, '')
  }

  let outline: MindMapOutline | null = null
  if (root.children.length === 1) {
    outline = stripDepth(root.children[0])
  } else if (root.children.length > 1) {
    const [first, ...rest] = root.children
    first.children.push(...rest)
    outline = stripDepth(first)
  } else {
    const label = clampLabel(firstPlainText ?? 'Mind map')
    outline = {
      id: newNodeId(),
      label,
    }
  }
  return clampTree(outline, 0, { count: 1 })
}

export function applyOps(root: MindMapOutline, ops: MindMapOp[]): number {
  let applied = 0
  for (const op of ops) {
    if (op.op === 'add') {
      const parent = findNode(root, op.parentId)
      if (!parent) continue
      const label = clampLabel(op.label.trim() || `Node ${(parent.children?.length ?? 0) + 1}`)
      parent.children = [...(parent.children ?? []), { id: newNodeId(), label }]
      applied += 1
    } else if (op.op === 'update') {
      const node = findNode(root, op.id)
      const label = op.label.trim()
      if (!node || !label) continue
      node.label = clampLabel(label)
      applied += 1
    } else if (op.op === 'remove') {
      const hit = findWithParent(root, op.id)
      if (!hit?.parent?.children) continue
      hit.parent.children = hit.parent.children.filter((child) => child.id !== op.id)
      if (hit.parent.children.length === 0) delete hit.parent.children
      applied += 1
    }
  }
  return applied
}

export function outlineToMarkdown(outline: MindMapOutline): string {
  const lines: string[] = []
  const walk = (node: MindMapOutline, depth: number) => {
    if (depth <= 2) {
      lines.push(`${'#'.repeat(depth)} ${node.label}`)
    } else {
      lines.push(`${'  '.repeat(depth - 3)}- ${node.label}`)
    }
    for (const child of node.children ?? []) walk(child, depth + 1)
  }
  walk(outline, 1)
  return lines.join('\n')
}

export function cloneOutline(outline: MindMapOutline): MindMapOutline {
  return {
    id: outline.id,
    label: outline.label,
    children: outline.children?.map(cloneOutline),
  }
}

interface InternalNode {
  id: string
  label: string
  depth: number
  children: InternalNode[]
}

function stripDepth(node: InternalNode): MindMapOutline {
  return {
    id: node.id,
    label: node.label,
    children: node.children.length ? node.children.map(stripDepth) : undefined,
  }
}

function clampTree(
  node: MindMapOutline,
  depth: number,
  counter: { count: number },
): MindMapOutline {
  const clamped: MindMapOutline = { id: node.id, label: clampLabel(node.label) }
  if (depth >= LIMITS.maxDepth || !node.children?.length) return clamped
  const children: MindMapOutline[] = []
  for (const child of node.children) {
    if (counter.count >= LIMITS.maxNodes) break
    counter.count += 1
    children.push(clampTree(child, depth + 1, counter))
  }
  if (children.length) clamped.children = children
  return clamped
}

function findNode(root: MindMapOutline, id: string): MindMapOutline | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

function findWithParent(
  root: MindMapOutline,
  id: string,
  parent: MindMapOutline | null = null,
): { node: MindMapOutline; parent: MindMapOutline | null } | null {
  if (root.id === id) return { node: root, parent }
  for (const child of root.children ?? []) {
    const found = findWithParent(child, id, root)
    if (found) return found
  }
  return null
}

function unwrapFence(text: string): string {
  const trimmed = text.trim()
  const closed = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```$/i.exec(trimmed)
  if (closed) return closed[1].trim()
  return trimmed
    .replace(/^```(?:markdown|md)?[^\n]*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
}

function clampLabel(label: string): string {
  return label.length > LIMITS.maxLabel ? `${label.slice(0, LIMITS.maxLabel - 1)}…` : label
}

function newNodeId(): string {
  return `node_${crypto.randomUUID().replaceAll('-', '')}`
}
