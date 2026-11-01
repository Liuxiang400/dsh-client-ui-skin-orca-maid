import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const registry = 'https://registry.npmjs.org'
const repository = 'Liuxiang400/dsh-skin-abyss'
const packageName = '@bendix400/dsh-client-ui-skin-orca-maid'
const readJSON = path => JSON.parse(readFileSync(path, 'utf8'))
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
const digest = (bytes, algorithm) => createHash(algorithm).update(bytes).digest(algorithm === 'sha512' ? 'base64' : 'hex')

export function releaseVersion(pkg, lock, tag) {
  const version = pkg.version
  const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/
  if (typeof version !== 'string' || !semver.test(version)) throw new Error('Expected a SemVer version without build metadata')
  if (tag !== `v${version}`) throw new Error(`Tag ${tag} must match package.json v${version}`)
  if (pkg.name !== packageName || pkg.repository?.url !== `git+https://github.com/${repository}.git`) throw new Error('Unexpected package or repository')
  if (lock.version !== version || lock.packages?.['']?.version !== version) throw new Error('package-lock.json version must match package.json')
  return { version, tag, prerelease: version.includes('-'), distTag: version.includes('-') ? 'next' : 'latest' }
}

export function verifyPublished(bytes, dist) {
  if (dist?.integrity !== `sha512-${digest(bytes, 'sha512')}`) {
    throw new Error('This npm version already exists with different bytes. Do not move its tag; publish a new version instead.')
  }
}

export function isOlderStable(version, latest) {
  if (!latest || version.includes('-') || latest.includes('-')) return false
  const a = version.split('.').map(BigInt)
  const b = latest.split('.').map(BigInt)
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return false
}

// npm can parse an unprefixed relative tarball path as GitHub owner/repo shorthand.
export function publishArguments(artifact, distTag) {
  return ['publish', resolve(artifact), '--access', 'public', '--provenance', '--tag', distTag, '--registry', registry, '--ignore-scripts']
}

async function getJSON(url, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GET ${url}: HTTP ${response.status}`)
  return response.json()
}

async function main(command) {
  const pkg = readJSON('package.json')
  const tag = process.env.GITHUB_EVENT_NAME === 'push' ? process.env.GITHUB_REF_NAME : `v${pkg.version}`
  const release = releaseVersion(pkg, readJSON('package-lock.json'), tag)
  if (command === 'validate') {
    console.log(`${release.tag}: npm ${release.distTag}, GitHub ${release.prerelease ? 'prerelease' : 'release'}`)
    return
  }
  if (command === 'pack') {
    mkdirSync('release', { recursive: true })
    const [packed] = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', 'release']))
    const bytes = readFileSync(`release/${packed.filename}`)
    writeFileSync('release/package.json', JSON.stringify({ ...release, filename: packed.filename, integrity: `sha512-${digest(bytes, 'sha512')}` }, null, 2))
    writeFileSync('release/SHA256SUMS.txt', `${digest(bytes, 'sha256')}  ${packed.filename}\n`)
    writeFileSync('release/notes.md', [
      `ABYSS · 深海终端 ${release.tag}`,
      '',
      `- [npm ${release.version}](https://www.npmjs.com/package/${pkg.name}/v/${release.version})`,
      `- 发布渠道：\`${release.distTag}\`。`,
      `- dsh 兼容范围：\`${pkg.peerDependencies['@deepseek-ai/dsh']}\`；Cordis：\`${pkg.peerDependencies['@deepseek-ai/cordis']}\`。`,
      '- 灰蓝像素头像、点阵首页标题、几何背景与终端面板。',
      '- 自带独立外观设置，无需旧皮肤管理器；旧管理器设置不自动迁移。',
      '- 工作状态像素心跳线，修复折叠思考过程的实色长条与样式热更新。',
      '- 沿用原 npm 包名；启用前请关闭其他皮肤，升级后重启 DSH 以刷新素材清单。',
      '- ABYSS 是唯一持续维护版本；旧版 0.1.2 保留下载，不再同步功能或宿主适配。',
      '- 附件 `.tgz` 与 npm 发布包完全一致；`SHA256SUMS.txt` 提供校验值。',
      '- 固定安装此版本：解压 `.tgz`，运行 `dsh plugin --profile desktop add <解压后package目录的绝对路径>`。',
      '',
      '构建与自动化测试已通过。下方为 GitHub 自动生成的变更记录。',
      '',
    ].join('\n'))
    console.log(`Prepared release/${packed.filename}`)
    return
  }
  if (!['npm', 'github'].includes(command)) throw new Error(`Unknown command: ${command}`)
  if (process.env.GITHUB_EVENT_NAME !== 'push' || process.env.GITHUB_REF !== `refs/tags/${release.tag}`) {
    throw new Error('Publishing is only allowed for a version-tag push')
  }
  const packed = readJSON('release/package.json')
  if (packed.tag !== release.tag) throw new Error('Packed version does not match release tag')
  const artifact = `release/${packed.filename}`
  const bytes = readFileSync(artifact)
  verifyPublished(bytes, { integrity: packed.integrity })
  const npmURL = `${registry}/${encodeURIComponent(pkg.name)}`
  if (command === 'npm') {
    const metadata = await getJSON(npmURL)
    const existing = metadata?.versions?.[release.version]
    if (existing) {
      verifyPublished(bytes, existing.dist)
      console.log('Identical npm version already published; continuing to GitHub Release.')
      return
    }
    if (isOlderStable(release.version, metadata?.['dist-tags']?.latest)) throw new Error('Refusing to move npm latest backwards; use an increasing stable version')
    console.log(run('npm', publishArguments(artifact, release.distTag)))
    return
  }
  // A GitHub-only retry must still prove that npm contains this exact artifact.
  const published = await getJSON(`${npmURL}/${encodeURIComponent(release.version)}`)
  verifyPublished(bytes, published?.dist)
  const api = `https://api.github.com/repos/${repository}/releases/tags/${release.tag}`
  const existing = await getJSON(api, { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' })
  const assets = [artifact, 'release/SHA256SUMS.txt']
  if (existing && !existing.draft) {
    for (const path of assets) {
      const asset = existing.assets.find(item => item.name === path.split('/').at(-1))
      if (asset?.digest !== `sha256:${digest(readFileSync(path), 'sha256')}`) throw new Error(`Published release asset missing or different: ${path}. Review it manually; published assets will not be overwritten.`)
    }
    console.log(`Release already complete: ${existing.html_url}`)
    return
  }
  if (!existing) {
    run('gh', ['release', 'create', release.tag, '--repo', repository, '--verify-tag', '--draft', '--title', release.tag, '--notes-file', 'release/notes.md', '--generate-notes', ...(release.prerelease ? ['--prerelease'] : [])])
  }
  run('gh', ['release', 'upload', release.tag, ...assets, '--repo', repository, '--clobber'])
  // Check server-side digests before making the draft public.
  const draft = await getJSON(api, { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' })
  for (const path of assets) {
    const asset = draft.assets.find(item => item.name === path.split('/').at(-1))
    if (asset?.digest !== `sha256:${digest(readFileSync(path), 'sha256')}`) throw new Error(`Uploaded asset checksum mismatch: ${path}`)
  }
  // Do not mark an older release latest when recovering a previously failed run.
  const metadata = await getJSON(npmURL)
  const latest = !release.prerelease && metadata?.['dist-tags']?.latest === release.version
  console.log(run('gh', ['release', 'edit', release.tag, '--repo', repository, '--draft=false', `--prerelease=${release.prerelease}`, `--latest=${latest}`]))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv[2]).catch(error => { console.error(error); process.exitCode = 1 })
}
