// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMaidScene } from '../src/client/scene.ts'

afterEach(() => {
  document.body.innerHTML = ''
  delete document.body.dataset.maidScene
})

describe('ORCA MAID scene controller', () => {
  it('places late-mounted scenes below the header and resets when it is removed', async () => {
    document.body.innerHTML = '<div data-slot="conversation.header"></div>'
    const header = document.body.firstElementChild as HTMLElement
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ bottom: 96 } as DOMRect)
    const dispose = installMaidScene(document.body)
    const scene = document.createElement('div')
    scene.dataset.skinChrome = 'light-scene'
    document.body.append(scene)
    await Promise.resolve()
    expect(scene.style.getPropertyValue('--maid-scene-top')).toBe('96px')
    expect(scene.style.getPropertyValue('--maid-scene-fade')).toBe('80px')
    header.remove()
    await Promise.resolve()
    expect(scene.style.getPropertyValue('--maid-scene-top')).toBe('0px')
    expect(scene.style.getPropertyValue('--maid-scene-fade')).toBe('0px')
    dispose()
    expect(scene.style.getPropertyValue('--maid-scene-top')).toBe('')
  })

  it('mirrors the conversation phase onto a stable body attribute', async () => {
    document.body.innerHTML = '<div data-phase="hero"><div><div data-conversation-scroll></div></div></div>'
    const dispose = installMaidScene(document.body)

    expect(document.body.dataset.maidScene).toBe('hero')

    const root = document.querySelector<HTMLElement>('[data-phase="hero"]')!
    root.dataset.phase = 'active'
    await Promise.resolve()
    expect(document.body.dataset.maidScene).toBe('active')

    dispose()
    expect(document.body.dataset.maidScene).toBeUndefined()
  })

  it('falls back to hero when no conversation root is present', () => {
    document.body.innerHTML = '<div></div>'
    const dispose = installMaidScene(document.body)
    expect(document.body.dataset.maidScene).toBe('hero')
    dispose()
  })
})
