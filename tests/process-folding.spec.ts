// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { transform } from 'lightningcss'
const source = readFileSync(resolve(process.cwd(),'src/client/abyss.module.css'))
afterEach(() => { document.head.innerHTML='';document.body.innerHTML='';document.body.removeAttribute('data-dsh-orca-maid');document.body.removeAttribute('data-abyss') })
it('folded searchable process owners keep no painted border, background or spacing', () => {
  const style=document.createElement('style')
  style.textContent=transform({filename:'abyss.module.css',code:source}).code.toString()
  document.head.append(style)
  document.body.setAttribute('data-dsh-orca-maid','');document.body.setAttribute('data-abyss','')
  document.body.innerHTML='<div data-step-process hidden="until-found"><div><button data-process-activity="thinking" aria-expanded="false">分析</button></div><div data-step-process-body hidden="until-found">仍可搜索的内容</div></div>'
  for(const el of document.querySelectorAll<HTMLElement>('[hidden]')){
    const css=getComputedStyle(el)
    expect(css.borderTopStyle).toBe('none')
    expect(css.paddingTop).toBe('0px')
    expect(css.marginTop).toBe('0px')
    expect(css.backgroundImage).toBe('none')
    expect(el.getAttribute('hidden')).toBe('until-found')
  }
  const body=document.querySelector('[data-step-process-body]')!
  body.removeAttribute('hidden')
  expect(getComputedStyle(body).paddingLeft).toBe('12px')
  expect(body.textContent).toBe('仍可搜索的内容')
})
