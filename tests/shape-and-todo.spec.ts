// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-maid.module.css'), 'utf8').replaceAll('\r\n', '\n')

describe('ORCA MAID rounded shape contract at the token level', () => {
  it('hands token-drawn surfaces the host radius scale instead of zeroing it', () => {
    expect(CSS).not.toMatch(/--dsw-radius-(xs|sm|md|lg|xl|panel): 0px/)
    expect(CSS).not.toContain('border-radius: 0')
  })

  it('rounds skin-owned chrome explicitly with the host tokens', () => {
    for (const token of ['--dsw-radius-md', '--dsw-radius-lg', '--dsw-radius-panel']) {
      expect(CSS).toContain(`border-radius: var(${token})`)
    }
  })
})

describe('ORCA MAID todo glyphs (DSH 0.1.7 StateDot markup)', () => {
  const glyph = "[data-testid='todo-panel'] li[data-status"
  it('hides the host StateDot and paints one glyph per status', () => {
    expect(CSS).toContain(`${glyph}] > [class*='_glyph'] > * {\n  display: none;`)
    for (const status of ['completed', 'in_progress']) expect(CSS).toContain(`${glyph}='${status}'] > [class*='_glyph']::before`)
  })

  it('fills the in-progress pixel field on a stepped cycle and stills it for reduced motion', () => {
    expect(CSS).toMatch(/li\[data-status='in_progress'\] > \[class\*='_glyph'\]::after \{[^}]*animation: maidTodoFill 2\.4s step-end infinite/)
    expect(CSS).toMatch(/@keyframes maidTodoFill \{[^@]*72% \{ clip-path: polygon\(3\.5px 12\.5px, 12\.5px 12\.5px, 12\.5px 3\.5px/)
    expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[^@]*li\[data-status='in_progress'\] > \[class\*='_glyph'\]::after \{\s*animation: none;/)
  })
})
