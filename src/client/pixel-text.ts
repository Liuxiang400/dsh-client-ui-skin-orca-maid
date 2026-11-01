/** Small original bitmap alphabet for skin-owned chrome; no font download. */
const GLYPHS: Record<string, string[]> = {
  A: ['01110','10001','10001','11111','10001','10001','10001'], B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'], D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'], H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'], L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'], N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'], P: ['11110','10001','10001','11110','10000','10000','10000'],
  R: ['11110','10001','10001','11110','10100','10010','10001'], S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'], U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'], W: ['10001','10001','10001','10101','10101','10101','01010'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'], X: ['10001','10001','01010','00100','01010','10001','10001'],
  '/': ['00001','00001','00010','00100','01000','10000','10000'],
}
const NS = 'http://www.w3.org/2000/svg'
function vector(doc: Document, path: string, width: number, height: number, scale: number): SVGSVGElement {
  const svg = doc.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', String(width * scale))
  svg.setAttribute('height', String(height * scale))
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('shape-rendering', 'crispEdges')
  const shape = doc.createElementNS(NS, 'path')
  shape.setAttribute('d', path)
  shape.setAttribute('fill', 'currentColor')
  svg.append(shape)
  return svg
}
export function bitmapLabel(doc: Document, text: string): HTMLElement {
  const label = doc.createElement('span')
  label.dataset.abyssBitmap = ''
  label.setAttribute('aria-label', text)
  let path = ''
  Array.from(text.toUpperCase()).forEach((char, index) => {
    GLYPHS[char]?.forEach((row, y) => Array.from(row).forEach((bit, x) => {
      if (bit === '1') path += `M${index * 6 + x} ${y}h1v1h-1z`
    }))
  })
  label.append(vector(doc, path, Math.max(1, text.length * 6 - 1), 7, 2))
  return label
}
/** Rasterize only this short, static heading; SVG inherits theme color without redrawing. */
export function pixelHeadline(doc: Document, text: string): SVGSVGElement | null {
  // Canvas is optional (SSR/test DOM/restricted browser): keep the text fallback.
  if (!doc.defaultView || typeof doc.defaultView.CanvasRenderingContext2D === 'undefined') return null
  const canvas = doc.createElement('canvas')
  canvas.width = 182
  canvas.height = 27
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.font = '600 18px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'top'
    ctx.fillText(text, Math.floor((182 - ctx.measureText(text).width) / 2), 3)
    const pixels = ctx.getImageData(0, 0, 182, 27).data
    let path = ''
    for (let y = 0; y < 27; y++) for (let x = 0; x < 182; x++) {
      if (pixels[(y * 182 + x) * 4 + 3] > 95) path += `M${x} ${y}h1v1h-1z`
    }
    return path ? vector(doc, path, 182, 27, 3) : null
  } catch { return null }
}
