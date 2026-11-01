/**
 * ORCA MAID scene controller.
 *
 * The hero/active background crossfade in the stylesheet is driven by a stable
 * body-level attribute. DSH may replace the conversation root node when a
 * session starts, so relying on `:has([data-phase=...])` alone can skip the
 * transition. This controller watches for the conversation root and mirrors its
 * phase onto `body[data-maid-scene]`, which survives node replacement.
 * @module @deepseek-ai/dsh-client-ui-skin-orca-maid/client/scene
 */

import { hasMutationOutsideTranscript } from './mutation-filter.ts'

const CONVERSATION_SCROLL_SELECTOR = '[data-conversation-scroll]'

function conversationRoot(body: HTMLElement): HTMLElement | null {
  for (const candidate of body.querySelectorAll<HTMLElement>('[data-phase]')) {
    const scrollport = candidate.querySelector<HTMLElement>(CONVERSATION_SCROLL_SELECTOR)
    if (scrollport?.closest('[data-phase]') === candidate) return candidate
  }
  return null
}

/** Install the body-level scene marker used by the background crossfade. */
export function installMaidScene(body: HTMLElement): () => void {
  let header: HTMLElement | null = null
  const scenes = (): NodeListOf<HTMLElement> => body.querySelectorAll(
    '[data-skin-chrome="light-scene"], [data-skin-chrome="dark-scene"]',
  )
  const syncBounds = (): void => {
    const bottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0)
    for (const scene of scenes()) {
      scene.style.setProperty('--maid-scene-top', `${bottom}px`)
      scene.style.setProperty('--maid-scene-fade', bottom > 0 ? '80px' : '0px')
    }
  }
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncBounds)
  const sync = (): void => {
    const root = conversationRoot(body)
    const phase = root?.dataset.phase
    const scene = phase === 'settling' || phase === 'active' ? 'active' : 'hero'
    if (body.dataset.maidScene !== scene) body.dataset.maidScene = scene
    const nextHeader = body.querySelector<HTMLElement>('[data-slot="conversation.header"]')
    if (nextHeader !== header) {
      resizeObserver?.disconnect()
      header = nextHeader
      if (header) resizeObserver?.observe(header)
      syncBounds()
    } else if ([...scenes()].some(layer => !layer.style.getPropertyValue('--maid-scene-top'))) {
      syncBounds()
    }
  }

  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTranscript(records)) sync()
  })
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-phase'],
  })
  sync()
  syncBounds()
  window.addEventListener('resize', syncBounds)

  return () => {
    observer.disconnect()
    resizeObserver?.disconnect()
    window.removeEventListener('resize', syncBounds)
    for (const scene of scenes()) {
      scene.style.removeProperty('--maid-scene-top')
      scene.style.removeProperty('--maid-scene-fade')
    }
    delete body.dataset.maidScene
  }
}
