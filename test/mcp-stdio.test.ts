import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('MCP stdio host integration', () => {
  it('connects through the MCP SDK client and reads the tool guide', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'mindmap-mcp-host-'))
    const client = new Client({ name: 'tool-autonomy-eval', version: '0.1.0' })
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['src/index.ts'],
      cwd: process.cwd(),
      env: {
        ...process.env,
        MINDMAP_DATA_DIR: dataDir,
        MINDMAP_DOCUMENT_ROOTS: dataDir,
      },
      stderr: 'pipe',
    })
    try {
      await client.connect(transport)
      const tools = await client.listTools()
      expect(tools.tools.map((tool) => tool.name)).toContain('mindmap_create')
      expect(tools.tools.map((tool) => tool.name)).toContain('mindmap_export')
      const guide = await client.callTool({ name: 'mindmap_guide', arguments: {} })
      expect(JSON.stringify(guide.content)).toContain('mindmap_export')
      expect(JSON.stringify(guide.content)).toContain("formats:['opml','png']")
    } finally {
      await client.close()
    }
  })
})
