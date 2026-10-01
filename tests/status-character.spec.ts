// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  installMaidStatusCharacter,
  isLinkStatus,
  statusFrame,
  statusFrameDuration,
  statusFrameInterval,
} from '../src/client/status-character.ts'
import type { LinkStatus } from '../src/client/link-status.ts'

const classes = {
  character: 'character',
  characterBubble: 'bubble',
  characterFrame: 'frame',
  characterSprite: 'sprite',
}

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.body.removeAttribute('data-orca-maid-status')
})

describe('ORCA MAID status character', () => {
  it('maps every link status to one stable atlas row and valid animation frames', () => {
    const statuses: LinkStatus[] = [
      'standby',
      'syncing',
      'working',
      'approval',
      'input',
      'review',
      'complete',
      'fault',
      'offline',
      'ready',
    ]
    statuses.forEach((status, row) => {
      const frames = Array.from({ length: 24 }, (_, index) => statusFrame(status, index))
      expect(new Set(frames.map(frame => frame.row))).toEqual(new Set([row]))
      expect(frames.every(frame => frame.frame >= 0 && frame.frame <= 7)).toBe(true)
    })
    expect(isLinkStatus('working')).toBe(true)
    expect(isLinkStatus('unknown')).toBe(false)
  })

  it('pins every status to its own row and the single static column', () => {
    const statuses: LinkStatus[] = [
      'standby',
      'syncing',
      'working',
      'approval',
      'input',
      'review',
      'complete',
      'fault',
      'offline',
      'ready',
    ]
    statuses.forEach((status, row) => {
      const frames = Array.from({ length: 24 }, (_, index) => statusFrame(status, index))
      expect(new Set(frames.map(frame => frame.row))).toEqual(new Set([row]))
      // 一张静态姿势：任何 sequenceIndex 都停在 0 列，不会漂到空列上
      expect(new Set(frames.map(frame => frame.frame))).toEqual(new Set([0]))
    })
  })

  it('keeps each status cadence while the playhead stays static', () => {
    expect(statusFrameInterval('working')).toBe(83)
    expect(statusFrameInterval('offline')).toBe(83)
    expect(statusFrameInterval('standby')).toBe(240)
    expect(statusFrameInterval('standby')).toBeGreaterThan(statusFrameInterval('working'))

    // 静态图集没有逐帧时长，逐帧时长回落到该状态的固定间隔
    expect(statusFrameDuration('working', 0)).toBe(83)
    expect(statusFrameDuration('standby', 0)).toBe(240)
    expect(statusFrameDuration('standby', 6)).toBe(240)
  })

  it('keeps the static pose anchored and stops ticking once it settles', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div data-slot="sidebar"><div><div></div></div></div>'
    document.body.dataset.orcaMaidStatus = 'standby'
    const dispose = installMaidStatusCharacter(document.body, classes)

    const character = document.querySelector<HTMLElement>('[data-orca-maid-character]')!
    const sprite = document.querySelector<HTMLElement>('[data-orca-maid-character-sprite]')!
    expect(sprite.style.transform).toBe('translate(0%, 0%)')
    expect(character.dataset.orcaMaidFrame).toBe('0')

    // 单格序列不排定时器：放很久也不会换帧，对齐偏移恒为 0
    vi.advanceTimersByTime(10_000)
    expect(character.dataset.orcaMaidFrame).toBe('0')
    expect(sprite.style.transform).toBe('translate(0%, 0%)')

    dispose()
  })

  it('mounts in the sidebar stage, follows body status, and retracts cleanly', async () => {
    document.body.innerHTML = '<div data-slot="sidebar"><div><div></div></div></div>'
    document.body.dataset.orcaMaidStatus = 'working'
    const dispose = installMaidStatusCharacter(document.body, classes)

    const character = document.querySelector<HTMLElement>('[data-orca-maid-character]')!
    const sprite = character.querySelector<HTMLElement>('[data-orca-maid-character-sprite]')!
    expect(character.parentElement).toBe(document.querySelector("[data-slot='sidebar'] > :first-child"))
    expect(character.dataset.orcaMaidStatus).toBe('working')
    expect(sprite.style.getPropertyValue('--maid-status-row')).toBe('2')

    document.body.dataset.orcaMaidStatus = 'approval'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(character.dataset.orcaMaidStatus).toBe('approval')
    expect(sprite.style.getPropertyValue('--maid-status-row')).toBe('3')

    dispose()
    expect(document.querySelector('[data-orca-maid-character]')).toBeNull()
  })
})
