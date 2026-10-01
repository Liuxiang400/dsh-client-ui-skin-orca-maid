import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * 这六个文件是上游 dsh-deep-whale 的**按字节副本**，不是依赖。
 *
 * 这个用例把它们钉在抄录时的上游 commit 上，好让「与上游逐字节一致」这句话
 * 变成可验证的：谁在本地顺手改了 vendor 代码，`npm test` 立刻会响。
 *
 * 如果失败且改动**是有意的**（例如上游修了 bug 而你在等下一次同步），
 * 先确认没问题，再用下面命令更新表里的哈希：
 *
 *   shasum -a 256 src/vendor/*.ts scripts/*.mjs
 *
 * 如果改动**不是**有意的，直接 `git checkout -- <文件>` 还原。
 * 想整体对齐上游则重跑维护工作区的 `sync-upstream-shared.py`。
 */
const UPSTREAM_COMMIT = 'e916a28d8413b5159917cfe9e0d9f7d407787a3d'

const VENDORED: Record<string, string> = {
  // 运行期共享代码：与皮肤管理器之间的资源路由 / 关系标记 / 定制协议
  'src/vendor/skin-assets.ts': '67a2a3304440984ad1979ec5bdc172d5ddaf86bb2a95ea9d16d089ee953c4169',
  'src/vendor/relational-markers.ts': '6a58219ec2151ec176596afc13f0df4804d6dc36dcdfce13aead3866a00fbce2',
  'src/vendor/protocol.ts': '4543dc52b13d4314e371748096ffc19851976163e595958ae10fefc198182306',
  // 构建期脚本：内容寻址素材准备 / 素材输入哈希 / 构建元数据写入
  'scripts/prepare-skin-assets.mjs': '5fa8072accd261360b14589fec1337904fc1c8d4c647a753a85e68360a75e0df',
  'scripts/skin-asset-inputs.mjs': '60cfa6bb96e9345e2e409cea09787b759bfa5be3afdfe6b6484915bb94ab3030',
  'scripts/write-skin-build.mjs': '28745fc219ac28cf4be85b373c0e0cf5de3cd76508d44545d9bcccd2120c3328',
}

describe('vendored upstream code', () => {
  it('钉住了上游 commit', () => {
    expect(UPSTREAM_COMMIT).toMatch(/^[0-9a-f]{40}$/)
  })

  for (const [path, expected] of Object.entries(VENDORED)) {
    it(`${path} 与上游 ${UPSTREAM_COMMIT.slice(0, 7)} 逐字节一致`, () => {
      const bytes = readFileSync(new URL(`../${path}`, import.meta.url))
      const actual = createHash('sha256').update(bytes).digest('hex')
      expect(
        actual,
        `${path} 与抄录时的上游版本不一致。若是误改请还原；若是有意改动，` +
          `请同步更新 tests/vendor-integrity.spec.ts 中的哈希与 UPSTREAM_COMMIT。`,
      ).toBe(expected)
    })
  }
})
