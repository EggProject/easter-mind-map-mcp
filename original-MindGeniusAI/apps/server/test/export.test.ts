import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

interface ExportTestBody {
  artifacts: Array<{ format: string; dataBase64: string }>
}

describe('export route', () => {
  it('exports markdown, OPML, and PNG artifacts', async () => {
    const app = createApp()
    const response = await app.request('/api/export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mindMap: {
          id: 'root',
          label: 'Root & Map',
          children: [{ id: 'child', label: 'Child' }],
        },
        formats: ['markdown', 'opml', 'png'],
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json() as ExportTestBody
    expect(body.artifacts.map((artifact: { format: string }) => artifact.format)).toEqual([
      'markdown',
      'opml',
      'png',
    ])
    const markdown = decode(body.artifacts[0].dataBase64)
    const opml = decode(body.artifacts[1].dataBase64)
    const png = Buffer.from(body.artifacts[2].dataBase64, 'base64')
    expect(markdown).toContain('# Root & Map')
    expect(opml).toContain('Root &amp; Map')
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })

  it('rejects unsupported export requests', async () => {
    const app = createApp()
    const response = await app.request('/api/export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formats: ['png'] }),
    })

    expect(response.status).toBe(400)
  })
})

function decode(dataBase64: string): string {
  return Buffer.from(dataBase64, 'base64').toString('utf8')
}
