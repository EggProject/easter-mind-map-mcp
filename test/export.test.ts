import { describe, expect, it } from 'bun:test'
import { exportMarkdown, exportOpml, exportPng } from '../src/export'

describe('exports', () => {
  const outline = { id: 'root', label: 'Root & "Map"', children: [{ id: 'child', label: 'Child' }] }

  it('exports OPML with escaped labels', () => {
    const opml = exportOpml(outline)
    expect(opml).toContain('<opml version="2.0">')
    expect(opml).toContain('Root &amp; &quot;Map&quot;')
  })

  it('exports markdown', () => {
    expect(exportMarkdown(outline)).toContain('# Root & "Map"')
  })

  it('exports a PNG resource payload', () => {
    const png = exportPng(outline)
    expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    expect(png.byteLength).toBeGreaterThan(100)
  })
})
