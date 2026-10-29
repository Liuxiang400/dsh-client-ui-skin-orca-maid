// @vitest-environment node
/**
 * ORCA MAID neutral palette.
 *
 * The rounded build also moved the skin from its warm-paper palette to a
 * restrained Notion/Linear-style neutral scale: off-white canvas, white
 * surfaces, near-black text, one soft blue accent and hairline borders. Dark
 * mode is a separate neutral palette, not a colour inversion. These specs pin
 * the semantic entry points so the warm paper tokens cannot creep back in.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-maid.module.css', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n')
describe('ORCA MAID neutral palette', () => {
  it('uses the light design tokens from the visual brief', () => {
    for (const declaration of [
      '--maid-blue: #2e86f7;',
      '--maid-ink: #171717;',
      '--maid-muted: #7a7a7a;',
      '--maid-line: rgba(23, 23, 23, 0.09);',
      'background-color: #f6f6f6;',
      '--dsw-specific-bubble: rgba(242, 243, 245, 0.84) !important;',
    ]) {
      expect(CSS).toContain(declaration)
    }
  })

  it('keeps dark mode neutral instead of inverting the light palette', () => {
    expect(CSS).toContain('--maid-blue: #5b9cf8;')
    expect(CSS).toContain('--maid-line: rgba(255, 255, 255, 0.1);')
    expect(CSS).toContain('background-color: #0f1012;')
  })

  it('has no warm paper palette left', () => {
    for (const warm of ['#f6f1e7', '#fbf7ef', '#ebe7de', '#ddd8cc', '#e8e4da', '#2563eb', '#4d91ff']) {
      expect(CSS).not.toContain(warm)
    }
  })
})
