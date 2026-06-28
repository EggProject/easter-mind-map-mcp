import { describe, expect, it } from 'bun:test'
import { exportToolResult } from '../src/mcp/server'

describe('MCP server tool result shaping', () => {
  it('returns typed resource_link content for export artifacts', () => {
    const result = exportToolResult('plan_1', {
      planningId: 'plan_1',
      version: 1,
      artifacts: [
        { format: 'opml', resourceUri: 'mindmap://exports/plan_1/1/opml' },
        { format: 'png', resourceUri: 'mindmap://exports/plan_1/1/png' },
      ],
    })

    expect(result.content.map((item) => item.type)).toEqual([
      'text',
      'resource_link',
      'resource_link',
    ])
    expect(result.content[1]).toMatchObject({
      uri: 'mindmap://exports/plan_1/1/opml',
      mimeType: 'text/x-opml',
    })
    expect(result.content[2]).toMatchObject({
      uri: 'mindmap://exports/plan_1/1/png',
      mimeType: 'image/png',
    })
  })
})
