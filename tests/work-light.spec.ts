// @vitest-environment node
/**
 * ORCA MAID sidebar work light.
 *
 * The sidebar rig is a depth cue behind the status character. It used to be a
 * warm white radial beam at 85% illumination, which read as a white halo above
 * the character on the night stage. The rounded build keeps only a cool,
 * mostly transparent gradient so the artwork reads without the haze.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const LIGHT = readFileSync(new URL('../src/client/work-light.module.css', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n')

describe('ORCA MAID sidebar work light', () => {
  it('keeps the sidebar rig cool and almost transparent', () => {
    expect(LIGHT).toContain('opacity: .28;')
    expect(LIGHT).toContain('rgba(150, 170, 200, .08)')
    expect(LIGHT).toContain('rgba(110, 130, 160, .03)')
    expect(LIGHT).not.toContain('#fff0c84a')
    expect(LIGHT).not.toContain('#ffdfad1c')
  })
})
