/** A decorative stepped trace, not a metric. The caller owns the real task state. */
export function createHeartbeat(doc: Document): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = doc.createElementNS(ns, 'svg')
  svg.dataset.abyssHeartbeat = ''
  svg.setAttribute('viewBox', '0 0 104 16')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const path = 'M0 8H22V6H26V8H36V4H40V12H44V2H48V14H52V8H72V6H76V8H104'
  for (const [name, d] of [['baseline', 'M0 8H104'], ['wave', path], ['pulse', path]]) {
    const node = doc.createElementNS(ns, 'path')
    node.dataset.abyssHeartbeatPart = name
    node.setAttribute('d', d)
    svg.append(node)
  }
  return svg
}
