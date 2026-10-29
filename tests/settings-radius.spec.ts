// @vitest-environment node
/**
 * ORCA MAID rounded-surface contract.
 *
 * The skin used to flatten the host radius scale and force every generated
 * settings card, tag chip, badge, status dot and toggle knob square. The
 * rounded build hands the official ui-theme scale back to the host and only
 * paints a radius on the chrome the skin draws itself. These specs pin that
 * reversal so the rectilinear pass cannot silently return.
 *
 * Rule blocks are matched with `\s*` between selector parts so the specs hold
 * under both LF and CRLF checkouts.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-maid.module.css', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n')

/**
 * The settings dialog in both mounts: inside its slot through DSH 0.1.7-rc.1,
 * portaled to <body> with `data-shortcut-modal='settings'` from rc.2.
 */
const SETTINGS_DIALOG = /:is\(\[data-slot='sidebar\.settings'\] \[role='dialog'\], \[role='dialog'\]\[data-shortcut-modal='settings'\]\)/.source

describe('ORCA MAID settings radius', () => {
  it('does not zero the host radius scale', () => {
    expect(CSS).not.toMatch(/--dsw-radius-(xs|sm|md|lg|xl|panel): 0px/)
  })

  it('has no universal zeroing left inside the settings dialog', () => {
    expect(CSS).not.toMatch(new RegExp(`${SETTINGS_DIALOG}\\s*\\*[^{]*\\{[^}]*border-radius: 0`))
  })

  it('has no chat-flow universal zeroing either', () => {
    expect(CSS).not.toMatch(/\[data-chat-flow\]\s*\*[^{]*\{[^}]*border-radius: 0/)
  })

  it('leaves no square-cornered chrome anywhere in the stylesheet', () => {
    expect(CSS).not.toContain('border-radius: 0')
    expect(CSS).not.toContain('corner-shape: square')
  })

  it('rounds the surfaces the skin paints itself with the host scale', () => {
    const composer = CSS.match(/\[data-composer-card\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(composer).toContain('border-radius: var(--dsw-radius-panel)')
    const scrollbar = CSS.match(/::-webkit-scrollbar-thumb\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(scrollbar).toContain('border-radius: 999px')
  })

  it('renders the switch as the host capsule with a round thumb', () => {
    expect(CSS).toMatch(/\[role='switch'\][\s\S]*?border-radius: 999px !important/)
    expect(CSS).toMatch(/\[class\*='thumb'\][\s\S]*?border-radius: 50% !important/)
  })
})
