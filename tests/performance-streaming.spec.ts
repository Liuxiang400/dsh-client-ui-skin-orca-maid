// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installOrcaMaidStatus } from '../src/client/link-status.ts'
import { hasMutationOutsideTranscript } from '../src/client/mutation-filter.ts'
import { installMaidStatusCharacter } from '../src/client/status-character.ts'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-maid.module.css'), 'utf8').replaceAll('\r\n', '\n')
const flush = (): Promise<void> => new Promise(done => { setTimeout(done, 0) })

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-dsh-whale-maid-character')
  delete document.body.dataset.orcaMaidStatus
})

function record(target: Node, added: Node[] = []): MutationRecord {
  return { type: 'childList', target, addedNodes: added as unknown as NodeList, removedNodes: [] as unknown as NodeList } as MutationRecord
}

describe('ORCA MAID streaming cost', () => {
  it('lets frame-level controllers skip transcript edits but not the transcript arriving', () => {
    document.body.innerHTML = '<div data-conversation-scroll><div data-chat-flow><p id="tail"></p></div></div>'
    const tail = document.getElementById('tail')!
    const flow = document.querySelector('[data-chat-flow]')!
    expect(hasMutationOutsideTranscript([record(tail, [document.createTextNode('x')])])).toBe(false)
    expect(hasMutationOutsideTranscript([record(flow.parentElement!, [flow])])).toBe(true)
  })

  it('coalesces transcript-only batches in the link signal and resolves the frame at once', async () => {
    document.body.innerHTML = `
      <div data-phase="active"><div data-conversation-scroll>
        <div data-chat-flow><div data-chat-flow-kind="message" id="row"></div></div>
        <div data-composer-seat><div data-composer-input data-phase="idle"></div></div>
      </div></div>`
    const dispose = installOrcaMaidStatus(document.body)
    expect(document.body.dataset.orcaMaidStatus).toBe('ready')
    vi.useFakeTimers()
    // A streaming row starts running inside the transcript: one trailing pass.
    const running = document.createElement('span')
    running.dataset.state = 'running'
    document.getElementById('row')!.append(running)
    await vi.advanceTimersByTimeAsync(0)
    expect(document.body.dataset.orcaMaidStatus).toBe('ready')
    await vi.advanceTimersByTimeAsync(130)
    expect(document.body.dataset.orcaMaidStatus).toBe('working')
    // An approval card lands outside the transcript: no wait.
    const approval = document.createElement('div')
    approval.dataset.approvalKey = 'k'
    document.querySelector('[data-composer-seat]')!.append(approval)
    await vi.advanceTimersByTimeAsync(0)
    expect(document.body.dataset.orcaMaidStatus).toBe('approval')
    dispose()
  })

  it('never redraws a static status and stays parked while it is switched off', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = "<div data-slot='sidebar'><div></div></div>"
    document.body.dataset.orcaMaidStatus = 'complete'
    const cls = { character: 'c', characterBubble: 'b', characterFrame: 'f', characterSprite: 's' }
    const spy = vi.spyOn(window, 'setTimeout')
    const dispose = installMaidStatusCharacter(document.body, cls)
    await vi.advanceTimersByTimeAsync(2_000)
    const settledCalls = spy.mock.calls.length

    // 每个状态只有一格静态姿势：循环不再排定时器，但状态切换仍然即时换行
    document.body.dataset.orcaMaidStatus = 'working'
    await vi.advanceTimersByTimeAsync(500)
    expect(document.querySelector<HTMLElement>('[data-orca-maid-character]')!.dataset.orcaMaidStatus)
      .toBe('working')
    expect(spy.mock.calls.length).toBe(settledCalls)

    document.documentElement.setAttribute('data-dsh-whale-maid-character', 'hidden')
    await vi.advanceTimersByTimeAsync(2_000)
    expect(spy.mock.calls.length).toBe(settledCalls)
    dispose()
  })

  it('pulses the link signal on opacity only', () => {
    const frames = CSS.match(/@keyframes maidSignalPulse \{([^@]*?)\n\}/)?.[1] ?? ''
    expect(frames).toContain('opacity')
    expect(frames).not.toContain('box-shadow')
  })
})
