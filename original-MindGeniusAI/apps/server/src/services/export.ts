import type { MindMapOutline } from '@mindgenius/shared'
import { deflateSync } from 'node:zlib'

export type ExportFormat = 'markdown' | 'opml' | 'png'

export interface ExportArtifact {
  format: ExportFormat
  mediaType: string
  bytes: number
  dataBase64: string
  createdAt: string
}

export function exportMindMap(
  mindMap: MindMapOutline,
  formats: ExportFormat[],
  markdown?: string,
): ExportArtifact[] {
  const createdAt = new Date().toISOString()
  return formats.map((format) => {
    const data = exportData(mindMap, format, markdown)
    return {
      format,
      mediaType: mediaTypeFor(format),
      bytes: data.byteLength,
      dataBase64: Buffer.from(data).toString('base64'),
      createdAt,
    }
  })
}

function exportData(
  mindMap: MindMapOutline,
  format: ExportFormat,
  markdown?: string,
): Uint8Array {
  if (format === 'markdown')
    return new TextEncoder().encode(markdown?.trim() || treeToMarkdown(mindMap))
  if (format === 'opml')
    return new TextEncoder().encode(treeToOPML(mindMap))
  // Easter MCP custom export API: MindGeniusAI's browser export is not exposed over HTTP,
  // so the server endpoint returns a deterministic PNG for MCP clients.
  return renderPng(mindMap)
}

function mediaTypeFor(format: ExportFormat): string {
  if (format === 'png')
    return 'image/png'
  return format === 'opml' ? 'text/x-opml' : 'text/markdown'
}

/** Mirrors apps/web/src/utils/export.ts markdown structure for API clients. */
export function treeToMarkdown(root: MindMapOutline): string {
  const lines: string[] = []
  const walk = (node: MindMapOutline, depth: number) => {
    if (!node.children?.length && depth > 0)
      lines.push(`${'  '.repeat(Math.max(0, depth - 1))}- ${node.label}`)
    else
      lines.push(`${'#'.repeat(Math.min(depth + 1, 6))} ${node.label}`)
    node.children?.forEach(child => walk(child, depth + 1))
  }
  walk(root, 0)
  return lines.join('\n')
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Mirrors apps/web/src/utils/export.ts OPML structure for API clients. */
export function treeToOPML(root: MindMapOutline): string {
  const outline = (node: MindMapOutline, indent: string): string => {
    const text = escapeXml(node.label)
    const children = node.children ?? []
    if (children.length === 0)
      return `${indent}<outline text="${text}"/>`
    const inner = children.map(child => outline(child, `${indent}  `)).join('\n')
    return `${indent}<outline text="${text}">\n${inner}\n${indent}</outline>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>${escapeXml(root.label)}</title></head>
  <body>
${outline(root, '    ')}
  </body>
</opml>`
}

type Rgba = [number, number, number, number]

interface Row {
  depth: number
  label: string
  parent?: number
  x: number
  y: number
  width: number
}

function renderPng(root: MindMapOutline): Uint8Array {
  const rows = layoutRows(root)
  const width = 1400
  const height = Math.max(420, rows.at(-1)!.y + 96)
  const rgba = new Uint8Array(width * height * 4)
  fill(rgba, width, height, [11, 13, 17, 255])
  for (const row of rows) {
    if (row.parent === undefined)
      continue
    const parent = rows[row.parent]
    const fromX = parent.x + parent.width
    const fromY = parent.y + 22
    const toX = row.x
    const toY = row.y + 22
    line(rgba, width, height, fromX, fromY, toX - 20, fromY, [84, 99, 122, 255])
    line(rgba, width, height, toX - 20, fromY, toX - 20, toY, [84, 99, 122, 255])
    line(rgba, width, height, toX - 20, toY, toX, toY, [84, 99, 122, 255])
  }
  for (const row of rows) {
    const fillColor: Rgba = row.depth === 0 ? [22, 101, 52, 255] : [20, 24, 33, 255]
    const borderColor: Rgba = row.depth === 0 ? [74, 222, 128, 255] : [59, 130, 246, 255]
    rect(rgba, width, height, row.x, row.y, row.width, 44, fillColor)
    strokeRect(rgba, width, height, row.x, row.y, row.width, 44, borderColor)
    drawText(rgba, width, height, row.x + 14, row.y + 13, row.label, [241, 245, 249, 255])
  }
  return encodePng(width, height, rgba)
}

function layoutRows(root: MindMapOutline): Row[] {
  const rows: Row[] = []
  const visit = (node: MindMapOutline, depth: number, parent?: number) => {
    const label = normalizeLabel(node.label)
    const index = rows.length
    const x = 48 + Math.min(depth, 5) * 220
    const y = 48 + rows.length * 64
    const width = Math.max(depth === 0 ? 320 : 220, Math.min(520, label.length * 12 + 32))
    rows.push({ depth, label, parent, x, y, width })
    node.children?.forEach(child => visit(child, depth + 1, index))
  }
  visit(root, 0)
  return rows
}

function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w ./:-]/g, '?')
    .slice(0, 42)
    .toUpperCase()
}

function fill(rgba: Uint8Array, width: number, height: number, color: Rgba): void {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1)
      setPixel(rgba, width, height, x, y, color)
  }
}

function rect(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgba,
): void {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1)
      setPixel(rgba, width, height, xx, yy, color)
  }
}

function strokeRect(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgba,
): void {
  line(rgba, width, height, x, y, x + w, y, color)
  line(rgba, width, height, x, y + h, x + w, y + h, color)
  line(rgba, width, height, x, y, x, y + h, color)
  line(rgba, width, height, x + w, y, x + w, y + h, color)
}

function line(
  rgba: Uint8Array,
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: Rgba,
): void {
  if (x1 === x2) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y += 1)
      setPixel(rgba, width, height, x1, y, color)
    return
  }
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x += 1)
    setPixel(rgba, width, height, x, y1, color)
}

function drawText(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  text: string,
  color: Rgba,
): void {
  let cursor = x
  for (const char of text) {
    drawGlyph(rgba, width, height, cursor, y, FONT[char] ?? FONT['?'], color)
    cursor += 12
  }
}

function drawGlyph(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  glyph: string[],
  color: Rgba,
): void {
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] === '1')
        rect(rgba, width, height, x + col * 2, y + row * 2, 2, 2, color)
    }
  }
}

function setPixel(
  rgba: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  color: Rgba,
): void {
  if (x < 0 || y < 0 || x >= width || y >= height)
    return
  const offset = (y * width + x) * 4
  rgba[offset] = color[0]
  rgba[offset + 1] = color[1]
  rgba[offset + 2] = color[2]
  rgba[offset + 3] = color[3]
}

function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), rowStart + 1)
  }
  return concat(
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', pngHeader(width, height)),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  )
}

function pngHeader(width: number, height: number): Uint8Array {
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width >>> 0)
  view.setUint32(4, height >>> 0)
  header[8] = 8
  header[9] = 6
  return header
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const body = concat(typeBytes, data)
  return concat(u32(data.length), body, u32(crc32(body)))
}

function u32(...values: number[]): Uint8Array {
  const bytes = new Uint8Array(values.length * 4)
  const view = new DataView(bytes.buffer)
  values.forEach((value, index) => view.setUint32(index * 4, value >>> 0))
  return bytes
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((sum, item) => sum + item.length, 0))
  let offset = 0
  for (const array of arrays) {
    out.set(array, offset)
    offset += array.length
  }
  return out
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i += 1)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

const FONT: Record<string, string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00100', '00100'],
  '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '_': ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
}
