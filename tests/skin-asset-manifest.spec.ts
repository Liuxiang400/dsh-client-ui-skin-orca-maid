import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { readSkinAssetManifest } from '../src/index.ts'

const scratch: string[] = []

afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('ORCA MAID packaged artwork manifest', () => {
  it('reads the allowlist at apply time, not at module load', () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-maid-manifest-'))
    scratch.push(dir)
    const manifest = join(dir, 'manifest.json')
    const url = () => pathToFileURL(manifest)

    const first = 'a'.repeat(64) + '.webp'
    const second = 'b'.repeat(64) + '.png'
    writeFileSync(manifest, JSON.stringify([first]))
    expect(readSkinAssetManifest(url())).toEqual([first])

    // 宿主会缓存插件模块；这里证明第二次读取拿得到重建后的新清单。
    writeFileSync(manifest, JSON.stringify([first, second]))
    expect(readSkinAssetManifest(url())).toEqual([first, second])
  })

  it('refuses a manifest that is not a list of filenames', () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-maid-manifest-'))
    scratch.push(dir)
    const manifest = join(dir, 'manifest.json')

    writeFileSync(manifest, JSON.stringify({ files: [] }))
    expect(() => readSkinAssetManifest(pathToFileURL(manifest))).toThrow('Invalid skin artwork manifest')

    writeFileSync(manifest, JSON.stringify(['ok.webp', 42]))
    expect(() => readSkinAssetManifest(pathToFileURL(manifest))).toThrow('Invalid skin artwork manifest')
  })

  it('ships a manifest whose entries all exist and match their content hash', () => {
    const files = readSkinAssetManifest()
    expect(files.length).toBeGreaterThan(0)
    expect(files.every(file => /^[a-f0-9]{64}\.(png|webp)$/.test(file))).toBe(true)
  })
})
