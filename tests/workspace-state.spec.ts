import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-maid.module.css', import.meta.url),
  'utf8',
).replaceAll('\r\n', '\n')

function declarationBlock(selector: string): string {
  const selectorIndex = css.indexOf(selector)
  expect(selectorIndex).toBeGreaterThanOrEqual(0)
  const blockStart = css.indexOf('{', selectorIndex)
  const blockEnd = css.indexOf('}', blockStart)
  return css.slice(blockStart + 1, blockEnd)
}

describe('workspace state styling', () => {
  it('uses one soft selected surface instead of rails and gradient washes', () => {
    const currentBlock = declarationBlock(
      "body[data-dsh-orca-maid] [data-slot='sidebar'] [role='tree']\n  > div[data-maid-workspace-current]\n  [role='treeitem'][aria-expanded]",
    )
    expect(currentBlock).toContain('background: var(--maid-selected)')
    expect(currentBlock).not.toContain('border-left')
    expect(currentBlock).not.toContain('linear-gradient')
  })

  it('adds no independent square marker or connector to the current workspace', () => {
    expect(css).not.toContain("> div[data-maid-workspace-current]\n  [role='treeitem'][aria-expanded]::after")
    expect(css).not.toContain("> div[data-maid-workspace-current]\n  [role='treeitem'][aria-expanded]::before")
    expect(css).not.toContain('--maid-tree-guide')
  })

  it('keeps hover neutral and selection low-saturation blue', () => {
    const hover = declarationBlock(
      "body[data-dsh-orca-maid] [data-slot='sidebar'] [role='treeitem'][aria-expanded]:hover",
    )
    expect(hover).toContain('background: var(--maid-hover)')
    const selected = declarationBlock(
      "body[data-dsh-orca-maid] [data-slot='sidebar'] div[role='treeitem'][aria-selected='true']",
    )
    expect(selected).toContain('background: var(--maid-selected)')
    expect(css).not.toContain("div[role='treeitem'][aria-selected='true']::after")
  })

  it('reserves blue for the current folder glyph, not for every open folder', () => {
    const currentIcon = declarationBlock(
      "body[data-dsh-orca-maid] [data-slot='sidebar'] [role='tree']\n  > div[data-maid-workspace-current]\n  [role='treeitem'][aria-expanded]\n  svg",
    )
    expect(currentIcon).toContain('color: var(--maid-blue)')
  })
})
