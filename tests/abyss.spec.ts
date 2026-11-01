// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installAbyss } from '../src/client/abyss.ts'
import { installAbyssPreferences, ABYSS_STORAGE_KEY } from '../src/client/abyss-preferences.ts'
import type { AppearanceDefinition } from '../src/client/appearance-state.ts'

const disposers: Array<() => void> = []
const flush = async () => { await new Promise<void>(resolve => setTimeout(resolve, 0)) }
afterEach(() => {
  for (const dispose of disposers.splice(0).reverse()) dispose()
  document.body.innerHTML = ''
  document.documentElement.lang = ''
  localStorage.clear()
  vi.restoreAllMocks()
})
function hero() {
  document.body.innerHTML = `<div data-slot="sidebar"><div><svg data-orca-maid-wordmark></svg><div data-slot="sidebar.footer.action"></div></div></div>
    <main data-phase="hero"><div data-conversation-scroll><div class="host_titleGroup"><span>Host title</span><span class="host_previewBadge">Preview</span></div><div data-chat-flow></div></div></main>`
}
describe('ABYSS presentation lifecycle', () => {
  it('keeps native heading and badge intact and releases all owned markup', () => {
    hero()
    const source = document.querySelector<HTMLElement>('.host_titleGroup > span')!
    const dispose = installAbyss(document.body)
    disposers.push(dispose)
    expect(source.textContent).toBe('Host title')
    expect(source.hasAttribute('data-abyss-headline-source')).toBe(true)
    expect(document.querySelector('[data-abyss-headline]')?.textContent).toBe('如切如磋，如琢如磨')
    expect(document.querySelector('.host_previewBadge')?.textContent).toBe('Preview')
    expect(document.querySelector('[data-abyss-geometry]')?.getAttribute('aria-hidden')).toBe('true')
    source.textContent = 'New native title'
    dispose()
    disposers.pop()
    expect(source.textContent).toBe('New native title')
    expect(source.hasAttribute('data-abyss-headline-source')).toBe(false)
    expect(document.querySelector('[data-skin-chrome]')).toBeNull()
    expect(document.body.hasAttribute('data-abyss')).toBe(false)
    expect(document.querySelector('[data-abyss-stage]')).toBeNull()
  })
  it('does not reconcile decorations for streaming transcript edits', async () => {
    hero()
    disposers.push(installAbyss(document.body))
    await flush()
    const query = vi.spyOn(document.body, 'querySelectorAll')
    document.querySelector('[data-chat-flow]')!.textContent = 'streamed answer'
    await flush()
    expect(query).not.toHaveBeenCalled()
  })
  it('releases detached stages and remounts after navigation without duplicates', async () => {
    hero()
    disposers.push(installAbyss(document.body))
    const old = document.querySelector('main')!
    const next = document.createElement('main')
    next.dataset.phase = 'active'
    next.innerHTML = '<div data-conversation-scroll><div data-chat-flow></div></div>'
    old.replaceWith(next)
    await flush()
    expect(old.hasAttribute('data-abyss-stage')).toBe(false)
    expect(document.querySelectorAll('[data-abyss-geometry]')).toHaveLength(1)
    expect(document.querySelector('[data-abyss-headline]')).toBeNull()
  })
})
function preferences() {
  const apply = vi.fn()
  const definition: AppearanceDefinition = {
    settings: [
      { key: 'texture', type: 'boolean', defaultValue: true, label: '扫描纹理', labelEn: 'Texture' },
      { key: 'character', type: 'boolean', defaultValue: true, label: '角色', labelEn: 'Character' },
    ], apply,
  }
  const local = installAbyssPreferences(document.documentElement, definition)
  disposers.push(local.dispose)
  return { local, apply }
}
describe('standalone appearance preferences', () => {
  it('runs without a manager, validates stored values and preserves only explicit choices', () => {
    localStorage.setItem(ABYSS_STORAGE_KEY, JSON.stringify({texture:false, character:'false', unknown:true}))
    hero()
    const { local, apply } = preferences()
    expect(apply.mock.lastCall?.[0].values).toEqual({texture:false, character:true})
    expect(document.querySelector('[data-slot="sidebar.footer.action"] > [data-abyss-settings-trigger]')).not.toBeNull()
  })
  it('persists checkbox changes, restores ABYSS defaults, and retracts the UI', () => {
    hero()
    const { local, apply } = preferences()
    const input = document.querySelector<HTMLInputElement>('input[name="texture"]')!
    input.checked = false
    input.dispatchEvent(new Event('change'))
    expect(JSON.parse(localStorage.getItem(ABYSS_STORAGE_KEY)!)).toEqual({texture:false})
    expect(apply.mock.lastCall?.[0].values.texture).toBe(false)
    const reset = [...document.querySelectorAll<HTMLButtonElement>('dialog button')].at(-1)!
    reset.click()
    expect(input.checked).toBe(true)
    local.dispose()
    disposers.pop()
    expect(apply.mock.lastCall?.[0]).toBeNull()
    expect(document.querySelector('dialog')).toBeNull()
    expect(document.querySelector('[data-abyss-settings-trigger]')).toBeNull()
  })
  it('survives unavailable storage and follows late locale initialization', async () => {
    hero()
    vi.spyOn(Storage.prototype,'getItem').mockImplementation(() => {throw Error('blocked')})
    preferences()
    document.documentElement.lang = 'en-US'
    await flush()
    expect(document.querySelector('[data-abyss-settings-trigger]')?.getAttribute('aria-label')).toBe('ABYSS appearance')
    document.documentElement.lang = 'zh-CN'
    await flush()
    expect(document.querySelector('dialog h2')?.textContent).toBe('ABYSS / 外观')
  })
  it('applies changes from another window and removes its storage listener on disposal', () => {
    hero()
    const { local, apply } = preferences()
    localStorage.setItem(ABYSS_STORAGE_KEY, '{"texture":false}')
    window.dispatchEvent(new StorageEvent('storage', { key: ABYSS_STORAGE_KEY }))
    expect(apply.mock.lastCall?.[0].values.texture).toBe(false)
    local.dispose(); disposers.pop(); apply.mockClear()
    window.dispatchEvent(new StorageEvent('storage', { key: ABYSS_STORAGE_KEY }))
    expect(apply).not.toHaveBeenCalled()
  })
})
