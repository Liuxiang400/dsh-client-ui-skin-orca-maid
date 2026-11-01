import type { AppearanceDefinition, AppearanceState } from './appearance-state.ts'
import { hasMutationOutsideTranscript } from './mutation-filter.ts'

export const ABYSS_STORAGE_KEY = 'dsh.orca-maid.abyss.preferences.v1'
/** Validated browser-local appearance settings with immediate application. */
export function installAbyssPreferences(root: HTMLElement, definition: AppearanceDefinition): {
  dispose(): void
} {
  const doc = root.ownerDocument
  const win = doc.defaultView!
  const switches = definition.settings.filter(setting => setting.type === 'boolean')
  const defaults = Object.fromEntries(definition.settings.map(setting => [setting.key, setting.defaultValue]))
  let overrides: Record<string, boolean> = {}
  let disposed = false
  const read = (): void => {
    overrides = {}
    try {
      const stored: unknown = JSON.parse(win.localStorage.getItem(ABYSS_STORAGE_KEY) ?? '{}')
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        for (const setting of switches) {
          const value = (stored as Record<string, unknown>)[setting.key]
          if (typeof value === 'boolean') overrides[setting.key] = value
        }
      }
    } catch { /* Private mode or a corrupt preference must not prevent activation. */ }
  }
  const state = (): AppearanceState => ({
    values: { ...defaults, ...overrides },
  })
  const inputs = new Map<string, HTMLInputElement>()
  const render = (): void => {
    if (disposed) return
    const next = state()
    definition.apply(next)
    for (const [key, input] of inputs) input.checked = next.values[key] === true
  }
  read()
  render()

  let english = /^en\b/i.test(root.lang)
  const dialog = doc.createElement('dialog')
  dialog.dataset.abyssPreferences = ''
  dialog.dataset.skinChrome = 'abyss-preferences'
  dialog.setAttribute('aria-label', english ? 'ABYSS appearance' : 'ABYSS 外观')
  const title = doc.createElement('h2')
  title.textContent = english ? 'ABYSS / Appearance' : 'ABYSS / 外观'
  const intro = doc.createElement('p')
  intro.textContent = english ? 'Saved in this browser. Changes apply immediately.' : '保存在当前浏览器，修改即时生效。'
  const close = doc.createElement('button')
  close.type = 'button'
  close.textContent = english ? 'Close' : '关闭'
  close.dataset.abyssClose = ''
  close.addEventListener('click', () => dialog.close())
  dialog.append(title, close, intro)
  const copyNodes = new Map<string, HTMLElement>()
  const saveStatus = doc.createElement('p')
  saveStatus.setAttribute('role', 'status')
  const persist = (): void => {
    try {
      win.localStorage.setItem(ABYSS_STORAGE_KEY, JSON.stringify(overrides))
      saveStatus.textContent = english ? 'Saved.' : '已保存。'
    } catch {
      saveStatus.textContent = english ? 'Applied for this session; storage is unavailable.' : '已在本次窗口生效；浏览器存储不可用，关闭后不会保留。'
    }
  }
  for (const setting of switches) {
    const label = doc.createElement('label')
    const input = doc.createElement('input')
    input.type = 'checkbox'
    input.name = setting.key
    input.checked = state().values[setting.key] === true
    const copy = doc.createElement('span')
    copy.textContent = english ? setting.labelEn ?? setting.label : setting.label
    copyNodes.set(setting.key, copy)
    label.append(input, copy)
    if (setting.description) {
      const description = doc.createElement('small')
      description.textContent = english ? setting.descriptionEn ?? setting.description : setting.description
      copy.append(description)
    }
    input.addEventListener('change', () => {
      overrides[setting.key] = input.checked
      render()
      persist()
    })
    inputs.set(setting.key, input)
    dialog.append(label)
  }
  const reset = doc.createElement('button')
  reset.type = 'button'
  reset.textContent = english ? 'Restore defaults' : '恢复默认'
  reset.addEventListener('click', () => { overrides = {}; persist(); render() })
  dialog.append(reset, saveStatus)
  doc.body.append(dialog)
  const trigger = doc.createElement('button')
  trigger.type = 'button'
  trigger.dataset.abyssSettingsTrigger = ''
  trigger.dataset.skinChrome = 'abyss-settings-trigger'
  trigger.setAttribute('aria-haspopup', 'dialog')
  trigger.setAttribute('aria-label', english ? 'ABYSS appearance' : 'ABYSS 外观设置')
  trigger.title = english ? 'ABYSS appearance' : 'ABYSS 外观设置'
  trigger.textContent = '▦'
  trigger.addEventListener('click', () => {
    if (!dialog.open) dialog.showModal()
  })
  dialog.addEventListener('close', () => { if (trigger.isConnected) trigger.focus() })
  const mount = (): void => {
    const target = doc.querySelector("[data-slot='sidebar.footer.action']")
      ?? doc.querySelector("[data-slot='sidebar'] > :first-child")
    if (target && trigger.parentElement !== target) {
      trigger.toggleAttribute('data-abyss-settings-fallback', !target.matches("[data-slot='sidebar.footer.action']"))
      target.append(trigger)
    }
  }
  const updateLanguage = (): void => {
    english = /^en\b/i.test(root.lang)
    const name = english ? 'ABYSS appearance' : 'ABYSS 外观设置'
    trigger.setAttribute('aria-label', name)
    trigger.title = name
    dialog.setAttribute('aria-label', name)
    title.textContent = english ? 'ABYSS / Appearance' : 'ABYSS / 外观'
    intro.textContent = english ? 'Saved in this browser. Changes apply immediately.' : '保存在当前浏览器，修改即时生效。'
    close.textContent = english ? 'Close' : '关闭'
    reset.textContent = english ? 'Restore defaults' : '恢复默认'
    for (const setting of switches) {
      const copy = copyNodes.get(setting.key)!
      copy.replaceChildren(doc.createTextNode(english ? setting.labelEn ?? setting.label : setting.label))
      if (setting.description) {
        const small = doc.createElement('small')
        small.textContent = english ? setting.descriptionEn ?? setting.description : setting.description
        copy.append(small)
      }
    }
    saveStatus.textContent = ''
  }
  const languageObserver = new MutationObserver(updateLanguage)
  languageObserver.observe(root, { attributes: true, attributeFilter: ['lang'] })
  const observer = new MutationObserver(records => {
    if (hasMutationOutsideTranscript(records) && !trigger.isConnected) mount()
  })
  observer.observe(doc.body, { childList: true, subtree: true })
  const storage = (event: StorageEvent): void => {
    if (event.key === ABYSS_STORAGE_KEY || event.key === null) { read(); render() }
  }
  win.addEventListener('storage', storage)
  mount()
  return {
    dispose() {
      disposed = true
      observer.disconnect()
      languageObserver.disconnect()
      win.removeEventListener('storage', storage)
      if (dialog.open) dialog.close()
      trigger.remove()
      dialog.remove()
      definition.apply(null)
    },
  }
}
