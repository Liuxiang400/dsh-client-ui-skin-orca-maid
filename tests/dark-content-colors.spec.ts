// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/client/orca-maid.module.css'), 'utf8')
const light = css.match(/^body\[data-dsh-orca-maid\] \{([^}]+)\}/)?.[1] ?? ''
const dark = css.match(/body\[data-dsh-orca-maid\]\[data-ds-dark-theme\] \{([^}]+)\}/)?.[1] ?? ''
const fileSelector = `body[data-dsh-orca-maid][data-ds-dark-theme] :is(
  [class*='_fileLink_'], [class$='_fileLink'], [class*='_fileLink '],
  [class*='_fileMention_'], [class$='_fileMention'], [class*='_fileMention ']
)`
const aliases = ['link', 'bg-document-selection', 'label-deep-diving-shimmer']

function token(block: string, name: string): string {
  const value = block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]
  if (!value) throw new Error(`Missing ${name}`)
  return value.replace(/\s*!important$/, '')
}

function luminance(hex: string): number {
  const rgb = hex.slice(1).match(/../g)!.map(channel => {
    const value = parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}

function contrast(fg: string, bg: string): number {
  const a = luminance(fg), b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

describe('dark content colors (issue #1)', () => {
  it('owns affected semantic aliases in dark mode without changing light mode', () => {
    for (const name of aliases) {
      expect(dark).toContain(`--dsw-alias-${name}:`)
      expect(dark).toMatch(new RegExp(`--dsw-alias-${name}:[^;]+!important;`))
      expect(light).not.toContain(`--dsw-alias-${name}:`)
    }
    expect(token(dark, '--dsw-alias-link')).toBe('var(--maid-blue)')
  })

  it('uses current dark accents for selection and shimmer instead of light static ramps', () => {
    expect(token(dark, '--dsw-alias-bg-document-selection')).toBe('color-mix(in srgb, var(--maid-blue) 40%, transparent)')
    expect(token(dark, '--dsw-alias-label-deep-diving-shimmer')).toBe('color-mix(in srgb, var(--dsw-alias-brand-text) 65%, var(--maid-cyan))')
    for (const name of ['--dsw-static-blue-300', '--dsw-static-blue-500', '--dsw-static-deepseek-400']) {
      expect(dark).not.toContain(`${name}:`)
    }
  })

  it('keeps link and file text above AA on representative opaque dark surfaces', () => {
    for (const accent of ['--maid-blue', '--maid-cyan']) {
      for (const surface of ['#0f1012', '#1b1c20', '#222328', '#303137']) {
        expect(contrast(token(dark, accent), surface)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('targets both host file class names, but not ordinary links or icons', () => {
    expect(css).toContain(`${fileSelector} {\n  --dsw-alias-link: var(--maid-cyan);\n  color: var(--dsw-alias-link);`)
    document.body.setAttribute('data-dsh-orca-maid', '')
    document.body.setAttribute('data-ds-dark-theme', '')
    document.body.innerHTML = `<a class="_markdown_a1">web</a><a class="_fileLink_a1">file<svg></svg></a><span class="_fileMention_b2">@file</span><a class="abc_fileLink extra">new file</a><span class="abc_fileMention">new mention</span><span class="abc_fileLinkIcon">icon</span>`
    expect([...document.querySelectorAll(fileSelector)].map(el => el.className)).toEqual(['_fileLink_a1', '_fileMention_b2', 'abc_fileLink extra', 'abc_fileMention'])
    document.body.removeAttribute('data-ds-dark-theme')
    expect(document.querySelectorAll(fileSelector)).toHaveLength(0)
    document.body.setAttribute('data-ds-dark-theme', '')
    document.body.removeAttribute('data-dsh-orca-maid')
    expect(document.querySelectorAll(fileSelector)).toHaveLength(0)
    document.body.removeAttribute('data-ds-dark-theme')
    document.body.innerHTML = ''
  })
})
