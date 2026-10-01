import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/orca-maid.module.css', import.meta.url), 'utf8')

describe('skin-manager stylesheet contract', () => {
  it('supports each MAID presentation toggle', () => {
    expect(css).toContain("data-dsh-whale-maid-character='hidden'")
    expect(css).toContain("data-dsh-whale-maid-character-mirror='mirrored'")
    expect(css).toContain("data-dsh-whale-maid-background='hidden'")
    expect(css).toContain("data-dsh-whale-maid-pricing='hidden'")
    expect(css).toContain("data-dsh-whale-maid-settings-layout='centered'")
  })

  it('lets the shared timer hide only illustration layers', () => {
    expect(css).toContain("data-dsh-whale-maid-art='hidden'")
    expect(css).toContain(':is(.lightSceneLayer, .darkSceneLayer)')
  })
})
