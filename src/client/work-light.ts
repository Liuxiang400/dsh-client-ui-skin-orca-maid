import './work-light.module.css'

/** A bounded light rig with drifting dust and compact sidebar clusters. */
export function createMaidWorkLight(mode: 'sidebar' | 'repair'): HTMLElement {
  const light = document.createElement('div')
  light.dataset.maidWorkLight = mode
  light.setAttribute('aria-hidden', 'true')
  const suspension = document.createElement('span')
  suspension.dataset.maidLightSuspension = ''
  const rig = document.createElement('div')
  rig.dataset.maidLightRig = ''
  const housing = document.createElement('span')
  housing.dataset.maidLightHousing = ''
  const illumination = document.createElement('div')
  illumination.dataset.maidLightIllumination = ''
  for (const part of ['tube', 'beam']) {
    const node = document.createElement('span')
    node.dataset.maidLightPart = part
    illumination.append(node)
  }
  rig.append(housing, illumination)
  light.append(suspension, rig)
  // Dust lives in room coordinates, outside the falling/rotating lamp rig.
  const dustParts = mode === 'sidebar'
    ? ['dust-near', 'dust-far', 'dust-mid']
    : ['dust-near', 'dust-far']
  for (const part of dustParts) {
    const dust = document.createElement('span')
    dust.dataset.maidLightPart = part
    if (mode === 'sidebar') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 100 100')
      svg.setAttribute('preserveAspectRatio', 'none')
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('focusable', 'false')
      svg.dataset.maidDustLinks = ''
      const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      // Match the percentage positions of the CSS light points.
      outline.setAttribute('d', part === 'dust-near'
        ? 'M50 12L8 72L50 90L92 72Z M50 12V90'
        : 'M22 26L72 44L39 78Z')
      outline.setAttribute('vector-effect', 'non-scaling-stroke')
      if (part === 'dust-near') {
        const rear = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        rear.setAttribute('d', 'M8 72H92')
        rear.setAttribute('opacity', '.4')
        rear.setAttribute('vector-effect', 'non-scaling-stroke')
        svg.append(rear)
      }
      svg.append(outline)
      dust.append(svg)
    }
    light.append(dust)
  }
  return light
}

const visibilityLeases = new WeakMap<HTMLElement, { count: number, dispose: () => void }>()

/** Pause the decorative compositor animations while this document is hidden. */
export function installMaidLightVisibility(body: HTMLElement): () => void {
  let lease = visibilityLeases.get(body)
  if (!lease) {
    const attribute = 'data-maid-lights-paused'
    const original = body.getAttribute(attribute)
    let written: string | null = null
    const sync = (): void => {
      written = document.hidden ? '' : null
      if (written === null) body.removeAttribute(attribute)
      else body.setAttribute(attribute, written)
    }
    lease = {
      count: 0,
      dispose: () => {
        document.removeEventListener('visibilitychange', sync)
        if (body.getAttribute(attribute) !== written) return
        if (original === null) body.removeAttribute(attribute)
        else body.setAttribute(attribute, original)
      },
    }
    visibilityLeases.set(body, lease)
    document.addEventListener('visibilitychange', sync)
    sync()
  }
  lease.count += 1
  let released = false
  return () => {
    if (released) return
    released = true
    if (--lease.count !== 0) return
    lease.dispose()
    visibilityLeases.delete(body)
  }
}
