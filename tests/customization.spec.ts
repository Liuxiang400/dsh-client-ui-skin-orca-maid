// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMaidCustomization } from '../src/client/customization.ts'
import { ABYSS_STORAGE_KEY } from '../src/client/abyss-preferences.ts'
let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.(); dispose = undefined
  localStorage.clear()
  document.body.innerHTML = ''
  for (const attribute of [...document.documentElement.attributes]) {
    if (/^data-(dsh-whale|abyss)/.test(attribute.name)) document.documentElement.removeAttribute(attribute.name)
  }
  vi.restoreAllMocks()
})
describe('ABYSS standalone appearance', () => {
  it('restores existing attributes and releases the owned controls', () => {
    document.documentElement.setAttribute('data-abyss-texture','before')
    localStorage.setItem(ABYSS_STORAGE_KEY, JSON.stringify({character:false,texture:false,heartbeat:false}))
    dispose = installMaidCustomization()
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-character')).toBe('hidden')
    expect(document.documentElement.getAttribute('data-abyss-texture')).toBe('off')
    expect(document.documentElement.getAttribute('data-abyss-heartbeat')).toBe('off')
    dispose(); dispose = undefined
    expect(document.documentElement.getAttribute('data-abyss-texture')).toBe('before')
    expect(document.documentElement.hasAttribute('data-dsh-whale-maid-character')).toBe(false)
    expect(document.querySelector('dialog')).toBeNull()
  })
  it('does not register or respond to legacy manager events', () => {
    const register = vi.fn()
    window.addEventListener('dsh:skin-customization-register-v2',register)
    dispose = installMaidCustomization()
    window.dispatchEvent(new Event('dsh:skin-customization-ready-v2'))
    expect(register).not.toHaveBeenCalled()
    window.removeEventListener('dsh:skin-customization-register-v2',register)
    expect(document.querySelector('button[data-abyss-close]')).not.toBeNull()
  })
  it('provides the current appearance controls and no schedule compatibility controls', () => {
    dispose = installMaidCustomization()
    const names=[...document.querySelectorAll<HTMLInputElement>('dialog input')].map(input=>input.name)
    expect(names).toContain('heartbeat')
    expect(names).toContain('pixelHeadline')
    expect(names).not.toContain('sfwMode')
    expect(document.querySelector('dialog')?.textContent).not.toContain('管理器')
  })
})
