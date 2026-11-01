import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { resolve } from 'node:path'
import { isOlderStable, publishArguments, releaseVersion, verifyPublished } from './release.mjs'

test('publishes a local tarball without GitHub shorthand ambiguity', () => {
  const args = publishArguments('release/skin-0.2.1.tgz', 'latest')
  assert.equal(args[0], 'publish')
  assert.equal(args[1], resolve('release/skin-0.2.1.tgz'))
  assert.ok(args.includes('--provenance'))
  assert.equal(args[args.indexOf('--tag') + 1], 'latest')
})

function fixture(version) {
  return [
    { name: '@bendix400/dsh-client-ui-skin-orca-maid', version, repository: { url: 'git+https://github.com/Liuxiang400/dsh-skin-abyss.git' } },
    { version, packages: { '': { version } } },
    `v${version}`,
  ]
}

test('stable and preview versions use separate npm channels', () => {
  assert.equal(releaseVersion(...fixture('0.1.3')).distTag, 'latest')
  for (const version of ['0.2.0-beta.1', '1.0.0-rc.0', '1.0.0-0']) {
    assert.equal(releaseVersion(...fixture(version)).distTag, 'next')
    assert.equal(releaseVersion(...fixture(version)).prerelease, true)
  }
})

test('rejects invalid, mismatched and noncanonical release versions', () => {
  for (const version of ['01.2.3', '1.2', '1.2.3-01', '1.2.3+build', '1.2.3-rc..1', '1.2.3;echo']) {
    assert.throws(() => releaseVersion(...fixture(version)))
  }
  const [pkg, lock] = fixture('0.1.3')
  assert.throws(() => releaseVersion(pkg, lock, 'v0.1.4'))
  assert.throws(() => releaseVersion(pkg, { ...lock, version: '0.1.2' }, 'v0.1.3'))
  assert.throws(() => releaseVersion({ ...pkg, name: 'other' }, lock, 'v0.1.3'))
})

test('retry only accepts the exact previously published tarball', () => {
  const bytes = Buffer.from('published artifact')
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`
  assert.doesNotThrow(() => verifyPublished(bytes, { integrity }))
  assert.throws(() => verifyPublished(Buffer.from('different artifact'), { integrity }))
  assert.throws(() => verifyPublished(bytes, undefined))
})

test('stable publication cannot move latest backwards', () => {
  assert.equal(isOlderStable('0.1.3', '0.2.0'), true)
  assert.equal(isOlderStable('1.9.0', '1.10.0'), true)
  assert.equal(isOlderStable('0.2.0', '0.1.9'), false)
  assert.equal(isOlderStable('0.1.3', '0.1.3'), false)
  assert.equal(isOlderStable('0.2.0-beta.1', '1.0.0'), false)
  assert.equal(isOlderStable('0.1.3', undefined), false)
})
