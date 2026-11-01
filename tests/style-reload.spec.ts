// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, expect, it } from 'vitest'
const bundle = readFileSync(resolve(process.cwd(),'lib/client.js'),'utf8')
afterEach(() => { document.head.innerHTML='' })
it('refreshes a retained stylesheet on bundle re-evaluation without duplicating tags', () => {
  const execute = new Function('window','document',bundle)
  const host = { __ModuleLoader__: { load({factory}: {factory: (require: () => never) => unknown}) { factory(() => {throw Error('unexpected dependency')}) } } }
  execute(host,document)
  const tags=[...document.querySelectorAll<HTMLStyleElement>('style[data-plugin-css]')]
  const abyss=tags.find(tag=>tag.dataset.pluginCss?.endsWith('/abyss.module.css'))!
  const expected=abyss.textContent
  abyss.textContent='/* previous build retained by host */'
  execute(host,document)
  expect(abyss.textContent).toBe(expected)
  expect(document.querySelectorAll('style[data-plugin-css]')).toHaveLength(tags.length)
  expect(abyss.dataset.plugin).toBe('@bendix400/dsh-client-ui-skin-orca-maid')
})
