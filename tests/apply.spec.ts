// @vitest-environment jsdom
/**
 * Maid Link skin apply spec — the template contract: the body
 * attribute the stylesheet is scoped on is set on apply and retracted on
 * dispose, and every injected chrome element (marked data-skin-chrome) is
 * removed. Extend with assertions specific to your surface.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { apply } from '../src/client/index.ts'
import { installMaidPageIcons } from '../src/client/page-icons.ts'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-maid.module.css'), 'utf8')
const TURN_MARK_SELECTOR = "[data-phase='active'] :has(+ * > * > [data-chat-flow]) > nav button[type='button'][aria-label]"

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.title = ''
  document.documentElement.lang = ''
  vi.unstubAllGlobals()
})

// Transcript-only batches reach the link signal on one coalesced trailing
// pass (link-status.ts), so waits cover that window.
const settleLinkStatus = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 140) })

describe('Maid Link skin apply', () => {
  it('keeps the upstream RC1 wide-table gutter stable across interaction states', () => {
    const rule = CSS.match(
      /\[data-chat-flow-kind='assistant-step'\] :global\(\.md-table-wide\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''

    expect(rule).toContain('padding-bottom: var(--dsh-scrollbar-width, 8px)')
    expect(rule).not.toContain('overflow-x:')
  })

  it('targets the alpha2 turn rail outside the transcript in every locale and follow state', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div>
          <div class="turn-slot">
            <nav aria-label="Turn navigation">
              <div><div>
                <div><button type="button" aria-label="Jump to turn 1" aria-current="true"></button></div>
                <div><button type="button" aria-label="Load and jump to turn 2" aria-busy="true"></button></div>
                <div><button type="button" aria-label="Load and jump to turn 3"></button></div>
              </div></div>
            </nav>
          </div>
          <div data-chat-following-tail><div class="chat-scroll"><div data-chat-flow></div></div></div>
          <div><button type="button" aria-label="Return to bottom"></button></div>
        </div>
      </div>
    `

    fiber = await mount()
    expect(document.querySelectorAll(TURN_MARK_SELECTOR)).toHaveLength(3)
    document.querySelector('[data-chat-following-tail]')!.removeAttribute('data-chat-following-tail')
    expect(document.querySelectorAll(TURN_MARK_SELECTOR)).toHaveLength(3)
    expect(CSS).toContain(TURN_MARK_SELECTOR)
    expect(CSS).not.toContain("nav[aria-label='轮次导航']")
    expect(CSS).not.toContain("[aria-label^='跳转到第']")
  })

  it('leaves host icon markup untouched', async () => {
    document.body.innerHTML = '<button type="button" aria-label="fixture"><svg width="16" height="16" viewBox="0 0 16 16" stroke-width="1.3"><path d="M1 1h2" stroke="currentColor"></path></svg></button>'
    const svg = document.querySelector('svg')!
    const before = svg.innerHTML
    fiber = await mount()
    expect(svg.innerHTML).toBe(before)
    expect(svg.hasAttribute('data-orca-maid-icon')).toBe(false)
    expect(svg.querySelector('[data-orca-maid-icon-art]')).toBeNull()
    await fiber.dispose()
    expect(svg.innerHTML).toBe(before)
  })

  it('sets the body attribute and retracts it on dispose', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-orca-maid')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-orca-maid')).toBe(false)
  })

  it('injects chrome and retracts every element on dispose', async () => {
    fiber = await mount()
    expect(document.body.querySelectorAll('[data-skin-chrome]')).toHaveLength(2)
    expect(document.body.querySelectorAll('[data-skin-chrome="light-scene"] > div')).toHaveLength(2)
    expect(document.body.querySelectorAll('[data-skin-chrome="dark-scene"] > div')).toHaveLength(2)
    expect(document.body.style.getPropertyValue('--orca-maid-light-hero-art')).toContain('/skin-assets/orca-maid/')
    expect(document.body.style.getPropertyValue('--orca-maid-light-active-art')).toContain('/skin-assets/orca-maid/')
    expect(document.body.style.getPropertyValue('--orca-maid-dark-hero-art')).toContain('/skin-assets/orca-maid/')
    expect(document.body.style.getPropertyValue('--orca-maid-dark-active-art')).toContain('/skin-assets/orca-maid/')
    expect(document.body.style.getPropertyValue('--orca-maid-sidebar-art')).toBe('')
    const favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
    expect(favicon).not.toBeNull()
    expect(favicon?.type).toBe('image/png')
    expect(favicon?.href).toMatch(/\/skin-assets\/orca-maid\/[a-f0-9]{64}\.png$/)
    await fiber.dispose()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBe(0)
    expect(document.body.style.getPropertyValue('--orca-maid-light-hero-art')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-maid-light-active-art')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-maid-dark-hero-art')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-maid-dark-active-art')).toBe('')
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull()
  })

  it('replaces the host tab icon and Web-app manifest with the skin web icon', async () => {
    // The host declares both links statically in its boot HTML, and a browser
    // honours the first usable declaration: an appended skin link would never
    // be reached, so the icon and the manifest are replaced instead.
    document.head.innerHTML = `
      <meta name="fixture-before" />
      <link rel="manifest" href="./manifest.webmanifest" />
      <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
      <meta name="fixture-after" />
    `
    const shape = (): string[] => Array.from(document.head.children)
      .filter(node => !(node instanceof HTMLTitleElement))
      .map(node => (
        node instanceof HTMLLinkElement
          ? `${node.tagName}[${node.getAttribute('rel')}]`
          : `${node.tagName}[${node.getAttribute('name')}]`
      ))
    fiber = await mount()

    expect(shape()).toEqual(['META[fixture-before]', 'META[fixture-after]', 'LINK[icon]', 'LINK[manifest]'])
    const favicon = document.head.querySelector<HTMLLinkElement>('link[data-skin-chrome="favicon"]')!
    expect(favicon.getAttribute('type')).toBe('image/png')
    expect(favicon.getAttribute('sizes')).toBe('192x192')
    const iconHref = favicon.getAttribute('href') ?? ''
    expect(iconHref).toMatch(/^http:\/\/localhost:3000\/skin-assets\/orca-maid\/[a-f0-9]{64}\.png$/)

    const manifestLink = document.head.querySelector<HTMLLinkElement>('link[data-skin-chrome="manifest"]')!
    expect(manifestLink.getAttribute('type')).toBe('application/manifest+json')
    const manifestHref = manifestLink.getAttribute('href') ?? ''
    const manifestPrefix = 'data:application/manifest+json,'
    expect(manifestHref.startsWith(manifestPrefix)).toBe(true)
    const manifest = JSON.parse(decodeURIComponent(manifestHref.slice(manifestPrefix.length)))
    expect(manifest.icons[0].src).toBe(iconHref)
    // Relative URLs cannot resolve against a data: manifest, so identity and
    // scope are absolute while the host's name and display mode are kept.
    const root = new URL('/', document.location.href).href
    expect(manifest).toEqual({
      id: root,
      name: 'DeepSeek Harness',
      short_name: 'DSH',
      start_url: root,
      scope: root,
      display: 'fullscreen',
      // Bitmap icons only: Windows rasterises the installed app, taskbar and
      // start-menu icons from them, and a `sizes: "any"` SVG entry lets the
      // update path pick an icon it cannot rasterise.
      icons: [
        { src: expect.stringMatching(/^http:\/\/localhost:3000\/skin-assets\/orca-maid\/[a-f0-9]{64}\.png$/), sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: expect.stringMatching(/^http:\/\/localhost:3000\/skin-assets\/orca-maid\/[a-f0-9]{64}\.png$/), sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    })

    await fiber.dispose()
    expect(document.head.querySelectorAll('link[data-skin-chrome]')).toHaveLength(0)
    expect(shape()).toEqual(['META[fixture-before]', 'LINK[manifest]', 'LINK[icon]', 'META[fixture-after]'])
    document.head.innerHTML = ''
  })

  it('keeps the skin page icons until the last overlapping activation is disposed', async () => {
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />'
    const first = await mount()
    const second = await mount()

    // Leaving the first installation in place: the second activation must not
    // capture the skin's own links as if they were the host's.
    await first.dispose()
    expect(document.head.querySelector('link[data-skin-chrome="favicon"]')).not.toBeNull()
    expect(document.head.querySelector('link[href="./favicon.svg"]')).toBeNull()

    await second.dispose()
    expect(document.head.querySelectorAll('link[data-skin-chrome]')).toHaveLength(0)
    expect(document.head.querySelector('link[href="./favicon.svg"]')).not.toBeNull()
    document.head.innerHTML = ''
    fiber = undefined
  })

  it('restores the host page icons when the replacement manifest cannot be built', async () => {
    document.head.innerHTML = `
      <link rel="manifest" href="./manifest.webmanifest" />
      <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    `
    vi.stubGlobal('URL', class {
      constructor() {
        throw new Error('fixture URL failure')
      }
    })

    expect(() => installMaidPageIcons()).toThrow('fixture URL failure')
    expect(document.head.querySelectorAll('*')).toHaveLength(2)
    expect(document.head.querySelector('link[href="./favicon.svg"]')).not.toBeNull()
    expect(document.head.querySelector('link[href="./manifest.webmanifest"]')).not.toBeNull()
    expect(document.head.querySelectorAll('link[data-skin-chrome]')).toHaveLength(0)

    vi.unstubAllGlobals()
    fiber = await mount()
    expect(document.head.querySelector('link[data-skin-chrome="favicon"]')).not.toBeNull()
    await fiber.dispose()
    expect(document.head.querySelector('link[href="./favicon.svg"]')).not.toBeNull()
    document.head.innerHTML = ''
  })

  it('replaces the production sidebar wordmark with DSH vector paths', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div><div><button type="button"><svg data-original-wordmark></svg></button></div></div>
      </div>
    `
    const pane = document.querySelector("[data-slot='sidebar'] > :first-child") as HTMLElement
    pane.getBoundingClientRect = () => ({ width: 336 } as DOMRect)
    fiber = await mount()
    const replacement = document.querySelector('[data-orca-maid-wordmark]')
    expect(replacement).toBeInstanceOf(SVGElement)
    expect(replacement?.querySelectorAll('path')).toHaveLength(3)
    expect(replacement?.parentElement === pane).toBe(true)
    const chip = document.querySelector('[data-orca-maid-signal]')
    expect(chip?.textContent).toContain('LINK ACTIVE')
    expect(chip?.parentElement).toBe(document.querySelector("[data-slot='sidebar'] > :first-child > :first-child"))
    const character = document.querySelector<HTMLElement>('[data-orca-maid-character]')
    expect(character?.parentElement).toBe(pane)
    expect(character?.dataset.orcaMaidStatus).toBe('standby')
    expect(character?.querySelector<HTMLElement>('[data-orca-maid-character-sprite]')?.style.getPropertyValue('--orca-maid-status-atlas'))
      .toContain('/skin-assets/orca-maid/')
    expect(pane.parentElement!.style.getPropertyValue('--maid-sidebar-width')).toBe('336px')
    // The stage width hangs on the pane, not the body: a write restyles the sidebar subtree only.
    expect(pane.style.getPropertyValue('--maid-sidebar-art-width')).toBe('336px')
    expect(document.body.style.getPropertyValue('--maid-sidebar-art-width')).toBe('')
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(true)
    await fiber.dispose()
    expect(document.querySelector('[data-orca-maid-wordmark]')).toBeNull()
    expect(document.querySelector('[data-orca-maid-signal]')).toBeNull()
    expect(document.querySelector('[data-orca-maid-character]')).toBeNull()
    expect(document.querySelector('[data-original-wordmark]')).not.toBeNull()
    expect(pane.parentElement!.style.getPropertyValue('--maid-sidebar-width')).toBe('')
    expect(pane.style.getPropertyValue('--maid-sidebar-art-width')).toBe('')
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(false)
  })

  it('seats the signal chip in the logo row behind the macOS top strip', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div class="root">
          <div class="x_topStrip"><button type="button" aria-label="Collapse sidebar"></button></div>
          <div class="x_logoRow"><span class="x_brand"></span></div>
        </div>
      </div>
    `
    const pane = document.querySelector("[data-slot='sidebar'] > :first-child") as HTMLElement
    pane.getBoundingClientRect = () => ({ width: 336 } as DOMRect)
    fiber = await mount()
    const chips = document.querySelectorAll('[data-orca-maid-signal]')
    expect(chips).toHaveLength(1)
    expect(chips[0]!.parentElement).toBe(document.querySelector('.x_logoRow'))
    // The window-button strip keeps only its own toggle.
    expect(document.querySelector('.x_topStrip [data-orca-maid-signal]')).toBeNull()
    expect(document.querySelector('[data-orca-maid-brand]')).toBeNull()
    await fiber.dispose()
    expect(document.querySelector('[data-orca-maid-signal]')).toBeNull()
  })

  it('commits the AppFrame target width only once across intermediate resize notifications', async () => {
    let notifyResize = (): void => {}
    class ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) { notifyResize = () => callback([], this as unknown as ResizeObserver) }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 56px minmax(0px, 1fr) 0px"></div></div></div>
      <div data-slot="sidebar"><div><div><button type="button"><svg></svg></button></div></div></div>
    `
    const pane = document.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    let measuredWidth = 55
    pane.getBoundingClientRect = () => ({ width: measuredWidth } as DOMRect)
    fiber = await mount()
    expect(pane.parentElement!.style.getPropertyValue('--maid-sidebar-width')).toBe('56px')

    const setProperty = vi.spyOn(pane.parentElement!.style, 'setProperty')
    frame.style.gridTemplateColumns = '280px minmax(0px, 1fr) 0px'
    for (const intermediate of [72, 164, 238, 280]) {
      measuredWidth = intermediate
      notifyResize()
    }
    const widthWrites = setProperty.mock.calls.filter(([property]) => property === '--maid-sidebar-width')
    expect(widthWrites).toEqual([['--maid-sidebar-width', '280px']])
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(true)
  })

  it('follows a sidebar drag without restyling the document per pointer frame', async () => {
    let notifyResize = (): void => {}
    class ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) { notifyResize = () => callback([], this as unknown as ResizeObserver) }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px minmax(0px, 1fr) 0px"></div></div></div>
      <div data-slot="sidebar"><div><div><button type="button"><svg></svg></button></div></div></div>
    `
    const pane = document.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    pane.getBoundingClientRect = () => ({ width: 280 } as DOMRect)
    fiber = await mount()
    expect(pane.style.getPropertyValue('--maid-sidebar-art-width')).toBe('280px')

    frame.setAttribute('data-dragging', '')
    await Promise.resolve()
    expect(document.body.hasAttribute('data-maid-sidebar-dragging')).toBe(true)

    // An earlier test may already hold this spy; count only this drag's writes.
    const setProperty = vi.spyOn(pane.parentElement!.style, 'setProperty')
    setProperty.mockClear()
    for (const width of [296, 310, 326]) {
      frame.style.gridTemplateColumns = `${width}px minmax(0px, 1fr) 0px`
      notifyResize()
      // The stage follows at pointer cadence...
      expect(pane.style.getPropertyValue('--maid-sidebar-art-width')).toBe(`${width}px`)
    }
    // ...while the sidebar slot's copy, which restyles the whole sidebar subtree, waits for the drop.
    expect(setProperty.mock.calls.filter(([property]) => property === '--maid-sidebar-width')).toEqual([])

    frame.removeAttribute('data-dragging')
    await Promise.resolve()
    expect(document.body.hasAttribute('data-maid-sidebar-dragging')).toBe(false)
    expect(pane.parentElement!.style.getPropertyValue('--maid-sidebar-width')).toBe('326px')
    // The body never carries the width while no settings overlay exists.
    expect(document.body.style.getPropertyValue('--maid-sidebar-width')).toBe('')
    await fiber.dispose()
    expect(pane.style.getPropertyValue('--maid-sidebar-art-width')).toBe('')
  })

  it('keeps the stage width through a collapse and does not rewrite it on re-expand', async () => {
    let notifyResize = (): void => {}
    class ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) { notifyResize = () => callback([], this as unknown as ResizeObserver) }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px minmax(0px, 1fr) 0px"></div></div></div>
      <div data-slot="sidebar"><div><div><button type="button"><svg></svg></button></div></div></div>
    `
    const pane = document.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    pane.getBoundingClientRect = () => ({ width: 280 } as DOMRect)
    fiber = await mount()

    frame.style.gridTemplateColumns = '56px minmax(0px, 1fr) 0px'
    pane.getBoundingClientRect = () => ({ width: 56 } as DOMRect)
    notifyResize()
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(false)
    expect(pane.style.getPropertyValue('--maid-sidebar-art-width')).toBe('280px')

    const setProperty = vi.spyOn(pane.style, 'setProperty')
    frame.style.gridTemplateColumns = '280px minmax(0px, 1fr) 0px'
    pane.getBoundingClientRect = () => ({ width: 280 } as DOMRect)
    notifyResize()
    expect(setProperty.mock.calls.filter(([property]) => property === '--maid-sidebar-art-width')).toEqual([])
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(true)
  })

  it('mirrors the sidebar width on the body only while the settings overlay exists', async () => {
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px minmax(0px, 1fr) 0px"></div></div></div>
      <div data-slot="sidebar"><div><div><button type="button"><svg></svg></button></div></div></div>
    `
    const pane = document.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
    pane.getBoundingClientRect = () => ({ width: 280 } as DOMRect)
    fiber = await mount()
    // The sidebar slot owns the state: a body write would restyle the whole document per toggle.
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(true)
    expect(document.body.hasAttribute('data-maid-sidebar-wide')).toBe(false)
    expect(document.body.style.getPropertyValue('--maid-sidebar-width')).toBe('')
    expect(document.body.hasAttribute('data-maid-settings-sidebar-wide')).toBe(false)

    // The settings portal is outside the sidebar, so it gets a body copy for as long as it lives.
    const mask = document.createElement('div')
    mask.setAttribute('role', 'presentation')
    mask.innerHTML = '<div role="dialog" aria-modal="true" data-shortcut-modal="settings"></div>'
    document.body.append(mask)
    await Promise.resolve(); await Promise.resolve()
    expect(document.body.hasAttribute('data-maid-settings-open')).toBe(true)
    expect(document.body.hasAttribute('data-maid-settings-sidebar-wide')).toBe(true)
    expect(document.body.style.getPropertyValue('--maid-sidebar-width')).toBe('280px')

    mask.remove()
    await Promise.resolve(); await Promise.resolve()
    expect(document.body.hasAttribute('data-maid-settings-sidebar-wide')).toBe(false)
    expect(document.body.style.getPropertyValue('--maid-sidebar-width')).toBe('')
    await fiber.dispose()
    expect(pane.parentElement!.hasAttribute('data-maid-sidebar-wide')).toBe(false)
  })

  it('tracks only the current conversation in the sidebar link signal', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div>
          <div><button type="button"><svg></svg></button></div>
          <div role="tree">
            <div role="treeitem" aria-selected="true">current</div>
            <div role="treeitem" aria-selected="false"><span data-state="running">background</span></div>
          </div>
        </div>
      </div>
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-composer-seat><div data-composer-input contenteditable="true" data-phase="plain"></div></div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase="hero"]')!
    const scroll = document.querySelector<HTMLElement>('[data-conversation-scroll]')!

    fiber = await mount()
    const signal = document.querySelector<HTMLElement>('[data-orca-maid-signal]')!
    const label = signal.querySelector<HTMLElement>('[data-orca-maid-signal-label]')!
    expect(signal.dataset.orcaMaidStatus).toBe('standby')
    expect(document.body.dataset.orcaMaidStatus).toBe('standby')
    expect(label.textContent).toBe('LINK ACTIVE')

    root.dataset.phase = 'active'
    scroll.innerHTML = `
      <div data-chat-flow>
        <div data-chat-flow-kind="assistant-step"><div data-state="ok"></div></div>
        <div data-chat-flow-kind="turn-tail"></div>
      </div>
      <div data-composer-seat><div data-composer-input contenteditable="true" data-phase="plain"></div></div>
    `
    await settleLinkStatus()
    expect(signal.dataset.orcaMaidStatus).toBe('complete')
    expect(document.body.dataset.orcaMaidStatus).toBe('complete')
    expect(label.textContent).toBe('TASK COMPLETE')

    scroll.querySelector('[data-chat-flow]')?.append(Object.assign(document.createElement('div'), { innerHTML: '<span data-state="running"></span>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('TASK RUNNING')

    scroll.querySelector("[data-state='running']")?.remove()

    // The host composer stop glyph (filled rounded square) is the structural
    // running signal for a plain streaming turn.
    const stop = document.createElement('button')
    stop.innerHTML = '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="3" fill="currentColor"></rect></svg>'
    scroll.append(stop)
    await settleLinkStatus()
    expect(label.textContent).toBe('TASK RUNNING')
    stop.remove()

    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-approval-key="approval"></div>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('AUTH REQUEST')

    scroll.querySelector('[data-approval-key]')?.parentElement?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-question-key="question"></div>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('INPUT REQUIRED')

    scroll.querySelector('[data-question-key]')?.parentElement?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-plan-review-key="review"></div>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('PLAN REVIEW')

    scroll.querySelector('[data-plan-review-key]')?.parentElement?.remove()
    scroll.querySelector('[data-chat-flow]')!.innerHTML = `
      <div data-step-process data-chat-group-key="process">
        <div><button data-process-activity="tools" aria-expanded="false"></button></div>
        <div data-step-process-body hidden="until-found"><div data-step-process-content data-chat-flow>
          <div data-chat-flow-kind="assistant-step"><div data-state="error"></div></div>
        </div></div>
      </div>
      <div data-chat-flow-kind="turn-tail"></div>
    `
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK FAULT')

    scroll.querySelector('[data-chat-flow]')!.innerHTML = ''
    await settleLinkStatus()
    expect(label.textContent).toBe('SESSION READY')

    scroll.querySelector('[data-chat-flow]')!.innerHTML = '<div data-chat-flow-kind="user"></div>'
    await settleLinkStatus()
    expect(label.textContent).toBe('SESSION READY')

    const composerInput = scroll.querySelector<HTMLElement>('[data-composer-input]')!
    composerInput.dataset.phase = 'submitting'
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK SYNC')
    composerInput.dataset.phase = 'plain'
    composerInput.setAttribute('aria-disabled', 'true')
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK OFFLINE')

    root.dataset.phase = 'hero'
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK ACTIVE')
  })

  it('pins the skin title and restores the original on dispose', async () => {
    document.title = 'original'
    fiber = await mount()
    expect(document.title).not.toBe('original')
    await fiber.dispose()
    expect(document.title).toBe('original')
  })

  it('completes the rail search open when the row lands focused but collapsed', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div>
          <div class="fixture_search">
            <button type="button" class="fixture_searchButton" aria-label="搜索会话" aria-expanded="false"></button>
            <input class="fixture_searchInput" type="text" placeholder="搜索会话…">
          </div>
        </div>
      </div>
    `
    const button = document.querySelector<HTMLButtonElement>('button.fixture_searchButton')!
    const input = document.querySelector<HTMLInputElement>('input.fixture_searchInput')!
    let clicks = 0
    // The host row opens on click (aria-expanded flips); the fixture mirrors
    // that so duplicate completions are absorbed like production.
    button.addEventListener('click', () => {
      clicks += 1
      button.setAttribute('aria-expanded', 'true')
    })
    fiber = await mount()
    // Sidebar already expanded by the rail click; the row landed collapsed.
    // jsdom does not synthesize focus events for programmatic focus, so the
    // event a real browser fires is dispatched explicitly.
    document.querySelector('[data-slot="sidebar"]')!.setAttribute('data-maid-sidebar-wide', '')
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise(resolve => { setTimeout(resolve, 460) })
    expect(clicks).toBe(1)
    // An already-open row is never re-clicked.
    button.setAttribute('aria-expanded', 'true')
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise(resolve => { setTimeout(resolve, 460) })
    expect(clicks).toBe(1)
    // A collapsed row that lost focus before the recheck stays untouched.
    button.setAttribute('aria-expanded', 'false')
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    input.blur()
    await new Promise(resolve => { setTimeout(resolve, 460) })
    expect(clicks).toBe(1)
    await fiber.dispose()
  })

  it('does not clobber a session title during teardown', async () => {
    fiber = await mount()
    document.title = 'active session · ORCA MAID'
    await fiber.dispose()
    fiber = undefined
    expect(document.title).toBe('active session · ORCA MAID')
  })

  it('plays the hero exit ghost only once the host leaves the hero phase', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card>
                <div data-composer-input contenteditable="true">launch</div>
                <button type="button">send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    // The press only arms a snapshot of the card: nothing is hidden yet.
    expect(seat.style.cssText).toBe('')
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(false)
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(0)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)
    expect(Number.parseFloat(seat.style.getPropertyValue('--maid-composer-enter-distance'))).toBe(window.innerHeight - 200 + 32)
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)

    await fiber.dispose()
    fiber = undefined
    expect(document.querySelector('[data-maid-composer-ghost]')).toBeNull()
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(false)
  })

  it('leaves the hero composer untouched when a candidate menu takes the Enter', async () => {
    // A candidate menu rendered into the composer card answers Enter with its
    // own pick, so the phase stays hero: the exit must never hide the seat on a
    // press the host did not treat as a submit.
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card>
                <div data-trigger-menu>
                  <div role="listbox" aria-activedescendant="dsh-slash-option-command-0">
                    <button id="dsh-slash-option-command-0" type="button" role="option" aria-selected="true">/plan</button>
                  </div>
                </div>
                <div data-composer-input contenteditable="true">/pl</div>
                <button type="button">send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    // The press arms a snapshot, but the host's menu consumed the key: nothing
    // may be mounted or hidden in that same turn.
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(0)
    expect(seat.style.cssText).toBe('')
    // Past the snapshot window the unconsumed press must have left no trace.
    await new Promise(resolve => { setTimeout(resolve, 850) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(0)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-exiting')).toBe(false)
    expect(seat.style.cssText).toBe('')
    expect(CSS).not.toContain('data-maid-composer-exiting')

    // An expired snapshot stays unclaimable: a later phase change must not
    // replay a press the host already spent.
    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(0)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('arms the same snapshot when the hero submit button is clicked', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card>
                <div data-composer-input contenteditable="true">launch</div>
                <button type="button">send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const button = card.querySelector<HTMLButtonElement>('button')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(seat.style.cssText).toBe('')
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(0)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('plays the exit ghost as soon as the host leaves hero, settling included', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card>
                <div data-composer-input contenteditable="true">launch</div>
                <button type="button">send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

    // A submit may run through settling while the session is created: the ghost
    // belongs to leaving hero, not to reaching active.
    root.dataset.phase = 'settling'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(false)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('still plays the exit ghost when the started session replaces the conversation root', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card>
                <div data-composer-input contenteditable="true">launch</div>
                <button type="button">send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const oldRoot = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

    // The started session swaps the conversation root while the adopted seat
    // node survives: the new root has no phase history to compare against.
    const newRoot = document.createElement('div')
    newRoot.dataset.phase = 'active'
    const scrollport = document.createElement('div')
    scrollport.setAttribute('data-conversation-scroll', '')
    const chatFlow = document.createElement('div')
    chatFlow.setAttribute('data-chat-flow', '')
    scrollport.append(chatFlow, seat)
    newRoot.append(scrollport)
    document.body.replaceChild(newRoot, oldRoot)

    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-maid-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('hides the active composer on upward scroll and restores it downward or at bottom', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div role="listbox"><div data-fixture-model-option>model option</div></div>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
        </div>
      </div>
    `
    const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    let scrollTop = 600
    let scrollTopReads = 0
    Object.defineProperties(scrollport, {
      scrollTop: {
        configurable: true,
        get: () => {
          scrollTopReads += 1
          return scrollTop
        },
        set: (value: number) => { scrollTop = value },
      },
      scrollHeight: { configurable: true, value: 1_400 },
      clientHeight: { configurable: true, value: 400 },
    })

    fiber = await mount()
    expect(scrollTopReads).toBe(0)
    const modelOption = document.querySelector<HTMLElement>('[data-fixture-model-option]')!
    modelOption.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    expect(scrollTopReads).toBe(0)

    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -6 }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    expect(scrollTopReads).toBe(1)
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    expect(seat.hasAttribute('data-maid-composer-motion')).toBe(true)
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    input.focus()
    scrollTop = 500
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    expect(document.activeElement).not.toBe(input)

    scrollTop = 540
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    input.focus()
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(true)
    input.blur()
    await new Promise(resolve => { queueMicrotask(resolve) })
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(false)

    scrollTop = 420
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    scrollTop = 1_000
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    // The promotion hint must outlive the transition and then release.
    await new Promise(resolve => { setTimeout(resolve, 400) })
    expect(seat.hasAttribute('data-maid-composer-motion')).toBe(false)
  })

  it('wheeling a long draft at its edge never hides the composer', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div data-composer-seat>
            <div data-composer-card>
              <div class="draft-scroll"><div data-composer-input contenteditable="true"></div></div>
            </div>
          </div>
        </div>
      </div>
    `
    const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const draft = document.querySelector<HTMLElement>('.draft-scroll')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    draft.style.overflowY = 'auto'
    Object.defineProperties(draft, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 700 },
    })
    let scrollTop = 600
    Object.defineProperties(scrollport, {
      scrollTop: { configurable: true, get: () => scrollTop, set: (value: number) => { scrollTop = value } },
      scrollHeight: { configurable: true, value: 1_400 },
      clientHeight: { configurable: true, value: 400 },
    })

    fiber = await mount()

    // draft scroller at its edge; the host forwards the delta to the transcript
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -120 }))
    scrollTop = 480
    scrollport.dispatchEvent(new Event('scroll')) // forwarded transcript scroll
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    // inertia tails (small deltas) refresh the same gesture window
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -6 }))
    scrollTop = 420
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    // once the window closes, transcript scroll-intent steers the seat again
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 250)
    try {
      scrollTop = 360
      scrollport.dispatchEvent(new Event('scroll'))
    } finally {
      vi.useRealTimers()
    }
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
  })

  it('collapses the composer from either inward handle and keeps it manually locked', async () => {
    document.documentElement.lang = 'zh-CN'
    document.body.innerHTML = `
      <div data-phase="active">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card><div data-composer-input contenteditable="true">保留这段草稿</div></div>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    root.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 } as DOMRect)
    card.getBoundingClientRect = () => ({ left: 100, top: 400, right: 700, bottom: 520, width: 600, height: 120 } as DOMRect)
    Object.defineProperties(scrollport, {
      scrollTop: { configurable: true, value: 500, writable: true },
      scrollHeight: { configurable: true, value: 1_400 },
      clientHeight: { configurable: true, value: 400 },
    })

    const pointer = (type: string, clientX: number, pointerId = 7): Event => {
      const buttons = type === 'pointerup' || type === 'pointercancel' ? 0 : 1
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons, clientX })
      Object.defineProperties(event, {
        pointerId: { value: pointerId },
        isPrimary: { value: true },
        pointerType: { value: 'mouse' },
      })
      return event
    }

    fiber = await mount()
    const handles = Array.from(card.querySelectorAll<HTMLButtonElement>('[data-maid-composer-handle]'))
    expect(handles.map(handle => handle.dataset.maidComposerHandle)).toEqual(['left', 'right'])
    expect(handles[0]?.getAttribute('aria-label')).toContain('向右')
    expect(handles[1]?.getAttribute('aria-label')).toContain('向左')
    expect(handles[0]?.hasAttribute('title')).toBe(false)

    handles[0]!.dispatchEvent(pointer('pointerdown', 100))
    document.dispatchEvent(pointer('pointermove', 220))
    document.dispatchEvent(pointer('pointerup', 220))

    expect(seat.hasAttribute('data-maid-composer-manual-hidden')).toBe(true)
    expect(seat.hasAttribute('inert')).toBe(true)
    expect(document.querySelector<HTMLElement>('[data-composer-input]')?.textContent).toBe('保留这段草稿')
    const restore = document.querySelector<HTMLButtonElement>('[data-maid-composer-restore]')!
    expect(restore).not.toBeNull()
    // Parked inside the band the card vacated, below the host's back-to-bottom
    // lane (16px above the composer) instead of 36px above the card.
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('412px')
    expect(restore.hasAttribute('title')).toBe(false)

    const toBottom = document.createElement('button')
    // Neutral class ending in the host's local name: the real class carries a
    // build-specific hash, so the fixture must not freeze one.
    toBottom.className = 'fixture_toBottom'
    toBottom.setAttribute('aria-label', '回到底部')
    // Host geometry: 34px, its right edge 16px inside the card (the card is
    // 32px wider than the chat column), its bottom 16px above the composer.
    // The chip was predicted onto the same centre line (667px).
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 350, right: 684, bottom: 384, width: 34, height: 34 } as DOMRect)
    scrollport.append(toBottom)
    await new Promise(resolve => { setTimeout(resolve, 0) })
    // Its arrival does not move the chip: the anchor never followed it.
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('412px')

    // A host that drops the button into the chip's band still cannot stack
    // them: the chip steps below it (bottom + 8px clearance).
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 396, right: 684, bottom: 430, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('438px')
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 350, right: 684, bottom: 384, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    expect(restore.style.top).toBe('412px')

    // Where the column padding wins (narrow stages) the button sits elsewhere;
    // the chip follows its measured centre line instead of the prediction.
    toBottom.getBoundingClientRect = () => ({ left: 640, top: 350, right: 674, bottom: 384, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    expect(restore.style.left).toBe('643px')
    expect(restore.style.top).toBe('412px')
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 350, right: 684, bottom: 384, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))

    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }))
    expect(seat.hasAttribute('data-maid-composer-manual-hidden')).toBe(true)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    restore.click()
    expect(seat.hasAttribute('data-maid-composer-manual-hidden')).toBe(false)
    expect(seat.hasAttribute('inert')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-restoring')).toBe(true)
  })

  it('rebounds a short composer-handle drag without hiding the draft', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true">draft</div></div></div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    root.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 } as DOMRect)
    card.getBoundingClientRect = () => ({ left: 100, top: 300, right: 700, bottom: 420, width: 600, height: 120 } as DOMRect)
    const pointer = (type: string, clientX: number, buttons = type === 'pointerup' ? 0 : 1): Event => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons, clientX })
      Object.defineProperties(event, {
        pointerId: { value: 11 },
        isPrimary: { value: true },
        pointerType: { value: 'mouse' },
      })
      return event
    }

    fiber = await mount()
    const right = card.querySelector<HTMLButtonElement>("[data-maid-composer-handle='right']")!
    right.dispatchEvent(pointer('pointerdown', 700))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(false)
    expect(seat.style.getPropertyValue('--maid-composer-scale')).toBe('')
    document.dispatchEvent(pointer('pointermove', 695))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(false)
    expect(seat.style.getPropertyValue('--maid-composer-scale')).toBe('')
    document.dispatchEvent(pointer('pointermove', 620, 0))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(false)
    document.dispatchEvent(pointer('pointerup', 695))
    expect(seat.hasAttribute('data-maid-composer-collapse-rebounding')).toBe(false)

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(Number.parseFloat(seat.style.getPropertyValue('--maid-composer-scale'))).toBeLessThan(1)
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(true)
    expect(seat.getAttribute('data-maid-composer-collapse-stage')).toBeNull()
    document.dispatchEvent(pointer('pointerup', 620))

    expect(seat.hasAttribute('data-maid-composer-manual-hidden')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-collapse-rebounding')).toBe(true)
    expect(document.querySelector('[data-maid-composer-restore]')).toBeNull()

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(true)
    document.dispatchEvent(pointer('pointermove', 615, 0))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-collapse-rebounding')).toBe(true)

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(true)
    window.dispatchEvent(new Event('blur'))
    expect(seat.hasAttribute('data-maid-composer-collapse-dragging')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-collapse-rebounding')).toBe(true)

    right.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    expect(seat.hasAttribute('data-maid-composer-manual-hidden')).toBe(true)
    expect(document.querySelector('[data-maid-composer-restore]')).not.toBeNull()
  })

  it('does not mount composer collapse handles on the new-session hero', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div data-conversation-scroll>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
        </div>
      </div>
    `

    fiber = await mount()
    expect(document.querySelector('[data-maid-composer-handle]')).toBeNull()
    expect(document.querySelector('[data-maid-composer-restore]')).toBeNull()
  })

  it('shows the composer only for hero and chat surfaces', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-slot="conversation.session">
            <div data-slot="conversation.view"><div data-chat-flow></div></div>
          </div>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
        </div>
      </div>
    `
    const view = document.querySelector<HTMLElement>("[data-slot='conversation.view']")!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!

    fiber = await mount()
    expect(seat.hasAttribute('data-maid-composer-outside-chat')).toBe(false)

    view.innerHTML = '<div data-fixture-plugin-surface="timeline"></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-maid-composer-outside-chat')).toBe(true)

    view.innerHTML = '<div data-fixture-plugin-surface="future-view"></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-maid-composer-outside-chat')).toBe(true)

    view.innerHTML = '<div data-chat-flow></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-maid-composer-outside-chat')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-entering')).toBe(true)

    await fiber.dispose()
    fiber = undefined
    expect(seat.hasAttribute('data-maid-composer-outside-chat')).toBe(false)
  })
})
