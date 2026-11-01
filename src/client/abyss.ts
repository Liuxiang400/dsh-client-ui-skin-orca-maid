import { hasMutationOutsideTranscript } from './mutation-filter.ts'
import { bitmapLabel, pixelHeadline } from './pixel-text.ts'

const TITLE = '如切如磋，如琢如磨'
const TITLE_SELECTOR = "[data-phase='hero'] [class*='titleGroup'] > span:not([class*='previewBadge'], [data-abyss-headline])"
/** Own only decorative nodes. No transcript rewrite, business state, request, or polling. */
export function installAbyss(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const original = body.getAttribute('data-abyss')
  body.setAttribute('data-abyss', '')
  const stages = new Map<HTMLElement, { decoration: HTMLElement, original: string | null }>()
  let source: HTMLElement | null = null
  let sourceMark: string | null = null
  let heading: HTMLElement | null = null
  let alive = true
  let vector: SVGSVGElement | null | undefined
  let signature: HTMLElement | null = null
  const releaseTitle = (): void => {
    if (source) {
      if (sourceMark === null) source.removeAttribute('data-abyss-headline-source')
      else source.setAttribute('data-abyss-headline-source', sourceMark)
    }
    heading?.remove()
    source = heading = null
  }
  const renderTitle = (): void => {
    if (!heading) return
    heading.querySelector('svg')?.remove()
    if (vector === undefined) vector = pixelHeadline(doc, TITLE)
    if (vector) heading.append(vector.cloneNode(true))
    heading.toggleAttribute('data-abyss-pixel-ready', Boolean(vector))
  }
  const mount = (): void => {
    for (const [stage, entry] of stages) if (!stage.isConnected) {
      entry.decoration.remove()
      if (entry.original === null) stage.removeAttribute('data-abyss-stage')
      else stage.setAttribute('data-abyss-stage', entry.original)
      stages.delete(stage)
    }
    for (const stage of body.querySelectorAll<HTMLElement>('[data-phase]')) {
      const scroll = stage.querySelector('[data-conversation-scroll]')
      if (!scroll || scroll.closest('[data-phase]') !== stage || stages.has(stage)) continue
      const decoration = doc.createElement('div')
      decoration.dataset.abyssGeometry = ''
      decoration.dataset.skinChrome = 'abyss-geometry'
      decoration.setAttribute('aria-hidden', 'true')
      // All shapes are fixed decorative geometry, not invented telemetry.
      for (const name of ['matrix', 'stairs', 'rail', 'raster']) {
        const part = doc.createElement('div')
        part.dataset.abyssGeometryPart = name
        if (name === 'matrix') for (let i = 0; i < 25; i++) part.append(doc.createElement('i'))
        decoration.append(part)
      }
      stages.set(stage, { decoration, original: stage.getAttribute('data-abyss-stage') })
      stage.setAttribute('data-abyss-stage', '')
      stage.append(decoration)
    }
    const found = body.querySelector<HTMLElement>(TITLE_SELECTOR)
    if (found !== source || (heading && !heading.isConnected)) {
      releaseTitle()
      if (found) {
        source = found
        sourceMark = source.getAttribute('data-abyss-headline-source')
        source.dataset.abyssHeadlineSource = ''
        heading = doc.createElement('span')
        heading.dataset.abyssHeadline = ''
        heading.dataset.skinChrome = 'abyss-headline'
        const text = doc.createElement('span')
        text.textContent = TITLE
        heading.append(text)
        source.after(heading)
        renderTitle()
      }
    }
    const brand = body.querySelector('[data-orca-maid-wordmark]')
    if (brand && (!signature || !signature.isConnected)) {
      signature = bitmapLabel(doc, 'ABYSS')
      signature.dataset.abyssBrand = ''
      signature.dataset.skinChrome = 'abyss-brand'
      brand.after(signature)
    }
  }
  const observer = new MutationObserver(records => {
    if (hasMutationOutsideTranscript(records)) mount()
  })
  observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phase'] })
  mount()
  void doc.fonts?.ready.then(() => {
    if (alive) { vector = undefined; renderTitle() }
  })
  return () => {
    alive = false
    observer.disconnect()
    releaseTitle()
    signature?.remove()
    for (const [stage, entry] of stages) {
      entry.decoration.remove()
      if (entry.original === null) stage.removeAttribute('data-abyss-stage')
      else stage.setAttribute('data-abyss-stage', entry.original)
    }
    if (original === null) body.removeAttribute('data-abyss')
    else body.setAttribute('data-abyss', original)
  }
}
