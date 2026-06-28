import type { MindMapOutline } from '@mindgenius/shared'
import { Hono } from 'hono'
import type { ExportFormat } from '../services/export'
import { exportMindMap } from '../services/export'

const FORMATS: ExportFormat[] = ['markdown', 'opml', 'png']

export const exportRoutes = new Hono()

exportRoutes.post('/export', async (c) => {
  const body = await c.req.json<{
    mindMap?: MindMapOutline
    markdown?: string
    formats?: ExportFormat[]
  }>()
  if (!body.mindMap)
    return c.json({ success: false, message: 'No mind map' }, 400)
  const formats = (body.formats?.length ? body.formats : FORMATS).filter(format =>
    FORMATS.includes(format),
  )
  if (formats.length === 0)
    return c.json({ success: false, message: 'No supported export formats' }, 400)
  return c.json({
    success: true,
    artifacts: exportMindMap(body.mindMap, formats, body.markdown),
  })
})
