import { describe, expect, it } from 'bun:test'
import { applyOps, buildMindMap, outlineToMarkdown, reduceAgentEvent } from '../src/mindmap'
import type { ReducedRun } from '../src/mindmap'

describe('mind map parser and reducer', () => {
  it('builds a deterministic outline from markdown headings and lists', () => {
    const outline = buildMindMap('# Root\n## Branch\n- Leaf')
    expect(outline?.label).toBe('Root')
    expect(outline?.children?.[0]?.label).toBe('Branch')
    expect(outline?.children?.[0]?.children?.[0]?.label).toBe('Leaf')
  })

  it('applies add update remove operations defensively', () => {
    const outline = { id: 'root', label: 'Root', children: [{ id: 'a', label: 'A' }] }
    expect(
      applyOps(outline, [
        { op: 'add', parentId: 'root', label: 'B' },
        { op: 'update', id: 'a', label: 'A2' },
        { op: 'update', id: 'missing', label: 'ignored' },
        { op: 'update', id: 'a', label: ' ' },
        { op: 'remove', id: 'missing' },
      ]),
    ).toBe(2)
    expect(outline.children?.map((child) => child.label)).toEqual(['A2', 'B'])

    expect(applyOps(outline, [{ op: 'remove', id: 'a' }])).toBe(1)
    expect(outline.children?.map((child) => child.label)).toEqual(['B'])

    const oneChild = { id: 'root', label: 'Root', children: [{ id: 'only', label: 'Only' }] }
    expect(applyOps(oneChild, [{ op: 'remove', id: 'only' }])).toBe(1)
    expect(oneChild.children).toBeUndefined()
  })

  it('handles fallback markdown shapes and output depth', () => {
    const plain = buildMindMap('Plain root')
    expect(plain?.label).toBe('Plain root')

    const multipleRoots = buildMindMap('# Root\n# Sibling')
    expect(multipleRoots?.children?.[0]?.label).toBe('Sibling')

    const longLabel = 'x'.repeat(250)
    expect(buildMindMap(longLabel)?.label).toHaveLength(200)

    expect(
      outlineToMarkdown({
        id: 'root',
        label: 'Root',
        children: [
          {
            id: 'branch',
            label: 'Branch',
            children: [{ id: 'leaf', label: 'Leaf' }],
          },
        ],
      }),
    ).toBe('# Root\n## Branch\n- Leaf')
  })

  it('handles every documented event type', () => {
    let state: ReducedRun = { assistantText: '', completedSteps: 0 }
    state = reduceAgentEvent(state, { type: 'text', delta: 'hello' })
    state = reduceAgentEvent(state, {
      type: 'tool-call',
      toolName: 'x',
      toolCallId: '1',
      input: {},
    })
    state = reduceAgentEvent(state, {
      type: 'tool-result',
      toolName: 'x',
      toolCallId: '1',
      output: {},
    })
    state = reduceAgentEvent(state, { type: 'mindmap-set', markdown: '# Root' })
    state = reduceAgentEvent(state, {
      type: 'mindmap-patch',
      ops: [{ op: 'add', parentId: state.mindMap!.id, label: 'Child' }],
    })
    state = reduceAgentEvent(state, { type: 'step-finish' })
    state = reduceAgentEvent(state, { type: 'error', message: 'boom' })
    expect(state.assistantText).toBe('hello')
    expect(state.mindMap?.children?.[0]?.label).toBe('Child')
    expect(state.completedSteps).toBe(1)
    expect(state.failedMessage).toBe('boom')
  })
})
