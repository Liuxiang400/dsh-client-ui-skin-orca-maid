import { ORCA_MAID_STATUS_ATLAS } from './art.ts'
import type { LinkStatus } from './link-status.ts'
import { hasMutationOutsideTranscript } from './mutation-filter.ts'
import { createMaidWorkLight } from './work-light.ts'

const CHARACTER_SELECTOR = '[data-orca-maid-character]'
const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child"
/** Projected by customization.ts from the character switch and the SFW schedule. */
const CHARACTER_VISIBILITY_ATTRIBUTE = 'data-dsh-whale-maid-character'

const FRAME_INTERVAL_MS_BY_STATUS: Record<LinkStatus, number> = {
  /* The new-session standby is deliberately slower than the 12fps working
     cadence: its blink loop reads as nervous at 83ms/frame, so it gets its own
     relaxed 240ms pacing instead of sharing the global cel rate. */
  standby: 240,
  syncing: 83,
  working: 83,
  approval: 83,
  input: 83,
  review: 83,
  complete: 83,
  fault: 83,
  offline: 83,
  ready: 83,
}

const STATUS_ROWS: Record<LinkStatus, number> = {
  standby: 0,
  syncing: 1,
  working: 2,
  approval: 3,
  input: 4,
  review: 5,
  complete: 6,
  fault: 7,
  offline: 8,
  ready: 9,
}

/**
 * ORCA MAID ships one static pose per status, so every sequence is a single
 * cell and the playhead never leaves column 0. The atlas keeps its 8 columns
 * because the artwork contract is an 8×10 grid: put wider sequences in here —
 * and fill STATUS_FRAME_ALIGNMENT — to turn a status into real animation
 * without touching the sprite math, the CSS or the row map.
 */
const FRAME_SEQUENCES: Record<LinkStatus, readonly number[]> = {
  standby: [0],
  syncing: [0],
  working: [0],
  approval: [0],
  input: [0],
  review: [0],
  complete: [0],
  fault: [0],
  offline: [0],
  ready: [0],
}

/**
 * Per-frame durations for statuses that need a non-uniform cadence. Array
 * length matches the status's FRAME_SEQUENCES entry; statuses without an entry
 * keep the fixed statusFrameInterval cadence. Static artwork needs no entry, so
 * this stays empty until a status gains real frames.
 */
const FRAME_DURATIONS_MS_BY_STATUS: Partial<Record<LinkStatus, readonly number[]>> = {}

const ONE_SHOT_STATUSES = new Set<LinkStatus>([
  'approval',
  'input',
  'complete',
  'fault',
  'ready',
])

/** Atlas cell size in px for the inline ORCA MAID status atlas (8×10 grid). */
const STATUS_ATLAS_CELL = 236

/**
 * Per-frame alignment compensation for every status row.
 *
 * The shipped artwork is one static pose per status, composed with a shared
 * ground line and a head anchor, so every offset is zero. The table stays
 * because the sprite applies it on every render: if you swap in real
 * multi-frame animation whose poses drift between cells, recompute these
 * source-pixel offsets (reference-frame centroid minus this frame's centroid)
 * instead of removing the plumbing.
 */
const STATUS_FRAME_ALIGNMENT: Record<LinkStatus, ReadonlyArray<readonly [number, number]>> = {
  standby: [[0, 0]],
  syncing: [[0, 0]],
  working: [[0, 0]],
  approval: [[0, 0]],
  input: [[0, 0]],
  review: [[0, 0]],
  complete: [[0, 0]],
  fault: [[0, 0]],
  offline: [[0, 0]],
  ready: [[0, 0]],
}

function sequenceOffset(status: LinkStatus, sequenceIndex: number, sequenceLength: number): number {
  if (ONE_SHOT_STATUSES.has(status)) return Math.min(sequenceIndex, sequenceLength - 1)
  return sequenceIndex % sequenceLength
}

export function isLinkStatus(value: string | undefined): value is LinkStatus {
  return value !== undefined && Object.hasOwn(STATUS_ROWS, value)
}

export function statusFrame(status: LinkStatus, sequenceIndex: number): { frame: number, row: number } {
  const sequence = FRAME_SEQUENCES[status]
  return {
    frame: sequence[sequenceOffset(status, Math.max(0, sequenceIndex), sequence.length)] ?? 0,
    row: STATUS_ROWS[status],
  }
}

export function statusFrameInterval(status: LinkStatus): number {
  return FRAME_INTERVAL_MS_BY_STATUS[status]
}

/** Duration of the frame shown at one sequence index (per-frame cadence). */
export function statusFrameDuration(status: LinkStatus, sequenceIndex: number): number {
  const sequence = FRAME_SEQUENCES[status]
  const durations = FRAME_DURATIONS_MS_BY_STATUS[status]
  if (durations === undefined) return statusFrameInterval(status)
  const offset = sequenceOffset(status, Math.max(0, sequenceIndex), sequence.length)
  return durations[offset] ?? statusFrameInterval(status)
}

function createBubble(className: string): HTMLElement {
  const bubble = document.createElement('span')
  bubble.className = className
  bubble.dataset.orcaMaidCharacterBubble = ''

  const glyph = document.createElement('span')
  glyph.dataset.orcaMaidCharacterBubbleGlyph = ''
  glyph.setAttribute('aria-hidden', 'true')
  bubble.append(glyph)
  return bubble
}

function createCharacter(classes: {
  character: string
  characterBubble: string
  characterFrame: string
  characterSprite: string
}): HTMLElement {
  const character = document.createElement('div')
  character.className = classes.character
  character.dataset.orcaMaidCharacter = ''
  character.dataset.skinChrome = 'status-character'
  character.setAttribute('aria-hidden', 'true')

  const frame = document.createElement('div')
  frame.className = classes.characterFrame
  const sprite = document.createElement('div')
  sprite.className = classes.characterSprite
  sprite.dataset.orcaMaidCharacterSprite = ''
  character.style.setProperty('--orca-maid-status-atlas', `url("${ORCA_MAID_STATUS_ATLAS}")`)
  sprite.style.setProperty('--orca-maid-status-atlas', `url("${ORCA_MAID_STATUS_ATLAS}")`)
  frame.append(sprite)
  character.append(frame, createMaidWorkLight('sidebar'), createBubble(classes.characterBubble))
  return character
}

/** Mount the MAID-specific state actor in the sidebar's existing art stage. */
export function installMaidStatusCharacter(body: HTMLElement, classes: {
  character: string
  characterBubble: string
  characterFrame: string
  characterSprite: string
}): () => void {
  let character: HTMLElement | null = null
  let sprite: HTMLElement | null = null
  let status: LinkStatus = 'standby'
  let sequenceIndex = 0
  let timeout: number | undefined

  const mount = (): void => {
    const pane = body.querySelector<HTMLElement>(SIDEBAR_PANE_SELECTOR)
    if (pane === null) return
    const existing = pane.querySelector<HTMLElement>(CHARACTER_SELECTOR)
    if (existing !== null) {
      character = existing
      sprite = existing.querySelector<HTMLElement>('[data-orca-maid-character-sprite]')
      return
    }
    character = createCharacter(classes)
    sprite = character.querySelector<HTMLElement>('[data-orca-maid-character-sprite]')
    pane.append(character)
  }

  const render = (): void => {
    mount()
    const nextStatus = isLinkStatus(body.dataset.orcaMaidStatus) ? body.dataset.orcaMaidStatus : 'standby'
    if (nextStatus !== status) {
      status = nextStatus
      sequenceIndex = 0
    }
    const current = statusFrame(status, sequenceIndex)
    if (character !== null) {
      if (character.dataset.orcaMaidStatus !== status) character.dataset.orcaMaidStatus = status
      if (character.dataset.orcaMaidFrame !== String(current.frame)) {
        character.dataset.orcaMaidFrame = String(current.frame)
      }
      character.style.setProperty('--maid-status-column', String(current.frame))
      character.style.setProperty('--maid-status-row', String(current.row))
      character.style.setProperty('--maid-status-x', `${(current.frame / 7) * 100}%`)
      character.style.setProperty('--maid-status-y', `${(current.row / 9) * 100}%`)
    }
    if (sprite !== null) {
      sprite.style.setProperty('--maid-status-column', String(current.frame))
      sprite.style.setProperty('--maid-status-row', String(current.row))
      sprite.style.setProperty('--maid-status-x', `${(current.frame / 7) * 100}%`)
      sprite.style.setProperty('--maid-status-y', `${(current.row / 9) * 100}%`)
      const alignment = STATUS_FRAME_ALIGNMENT[status]?.[current.frame]
      if (alignment !== undefined) {
        sprite.style.transform = `translate(${(alignment[0] / STATUS_ATLAS_CELL) * 100}%, ${(alignment[1] / STATUS_ATLAS_CELL) * 100}%)`
      } else {
        sprite.style.transform = ''
      }
    }
  }

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  const doc = body.ownerDocument
  // The loop only runs while a frame change could be seen: a single-cell
  // sequence never changes, so a static status parks after its first render
  // instead of redrawing the same cell every 83ms; it also stays parked in a
  // background window, while the manager (or the SFW schedule) has the
  // character switched off, and once a one-shot sequence has settled on its
  // last cell.
  const animating = (): boolean => (
    FRAME_SEQUENCES[status].length > 1
    && doc.visibilityState !== 'hidden'
    && doc.documentElement.getAttribute(CHARACTER_VISIBILITY_ATTRIBUTE) !== 'hidden'
    && prefersReducedMotion?.matches !== true
    && !(ONE_SHOT_STATUSES.has(status) && sequenceIndex >= FRAME_SEQUENCES[status].length - 1)
  )

  const tick = (): void => {
    timeout = undefined
    sequenceIndex += 1
    render()
    scheduleTick()
  }

  const scheduleTick = (): void => {
    if (timeout !== undefined) window.clearTimeout(timeout)
    timeout = undefined
    if (!animating()) return
    timeout = window.setTimeout(tick, statusFrameDuration(status, sequenceIndex))
  }

  // Resume where the loop stopped once the character can be seen again.
  const resume = (): void => {
    if (timeout === undefined) scheduleTick()
  }
  const visibilityObserver = new MutationObserver(resume)
  visibilityObserver.observe(doc.documentElement, { attributes: true, attributeFilter: [CHARACTER_VISIBILITY_ATTRIBUTE] })
  doc.addEventListener('visibilitychange', resume)
  prefersReducedMotion?.addEventListener?.('change', resume)

  const observer = new MutationObserver((records) => {
    if (!hasMutationOutsideTranscript(records)) return
    const previousStatus = status
    render()
    if (status !== previousStatus) scheduleTick()
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-orca-maid-status'],
    childList: true,
    subtree: true,
  })
  render()
  scheduleTick()

  return () => {
    if (timeout !== undefined) window.clearTimeout(timeout)
    observer.disconnect()
    visibilityObserver.disconnect()
    doc.removeEventListener('visibilitychange', resume)
    prefersReducedMotion?.removeEventListener?.('change', resume)
    body.querySelectorAll(CHARACTER_SELECTOR).forEach(element => element.remove())
  }
}
