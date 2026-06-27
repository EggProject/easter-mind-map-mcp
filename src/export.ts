import { deflateSync } from 'node:zlib'
import { outlineToMarkdown } from './mindmap'
import type { MindMapOutline } from './types'

export function exportOpml(outline: MindMapOutline): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '<head><title>Mind map</title></head>',
    '<body>',
    outlineToOpml(outline, 1),
    '</body>',
    '</opml>',
  ].join('\n')
}

export function exportMarkdown(outline: MindMapOutline): string {
  return outlineToMarkdown(outline)
}

export function exportPng(outline: MindMapOutline): Uint8Array {
  const nodes = flatten(outline)
  const width = 960
  const height = Math.max(360, 120 + nodes.length * 46)
  const rgba = new Uint8Array(width * height * 4)
  fill(rgba, width, height, 248, 250, 252, 255)
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i]
    const x = 48 + node.depth * 150
    const y = 48 + i * 46
    rect(rgba, width, height, x, y, Math.max(120, Math.min(360, node.label.length * 9)), 28, [
      node.depth === 0 ? 22 : 59,
      node.depth === 0 ? 101 : 130,
      node.depth === 0 ? 52 : 246,
      255,
    ])
  }
  return encodePng(width, height, rgba)
}

function outlineToOpml(node: MindMapOutline, depth: number): string {
  const indent = '  '.repeat(depth)
  const attrs = `text="${escapeXml(node.label)}" _id="${escapeXml(node.id)}"`
  if (!node.children?.length) return `${indent}<outline ${attrs}/>`
  return [
    `${indent}<outline ${attrs}>`,
    ...node.children.map((child) => outlineToOpml(child, depth + 1)),
    `${indent}</outline>`,
  ].join('\n')
}

function flatten(root: MindMapOutline): Array<{ label: string; depth: number }> {
  const out: Array<{ label: string; depth: number }> = []
  const walk = (node: MindMapOutline, depth: number) => {
    out.push({ label: node.label, depth })
    for (const child of node.children ?? []) walk(child, depth + 1)
  }
  walk(root, 0)
  return out
}

function fill(
  rgba: Uint8Array,
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a: number,
): void {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      rgba[offset] = r
      rgba[offset + 1] = g
      rgba[offset + 2] = b
      rgba[offset + 3] = a
    }
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
  color: [number, number, number, number],
): void {
  for (let yy = Math.max(0, y); yy < Math.min(height, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(width, x + w); xx += 1) {
      const offset = (yy * width + xx) * 4
      rgba[offset] = color[0]
      rgba[offset + 1] = color[1]
      rgba[offset + 2] = color[2]
      rgba[offset + 3] = color[3]
    }
  }
}

function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), rowStart + 1)
  }
  const chunks = [
    chunk('IHDR', u32(width, height, 8, 6, 0, 0, 0)),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ]
  return concat(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks)
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
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
