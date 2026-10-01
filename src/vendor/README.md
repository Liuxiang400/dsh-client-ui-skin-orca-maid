# vendor/

本目录是**内联自上游 monorepo 的共享代码**，让本包可以独立成仓库而不依赖
`Small-tailqwq/dsh-deep-whale` 的目录结构。

| 本目录文件 | 上游来源 | 用途 |
|---|---|---|
| `skin-assets.ts` | `shared/skin-assets.ts` | node 半边：`/skin-assets/<id>/` 不可变资源路由 |
| `relational-markers.ts` | `shared/relational-markers.ts` | 客户端：给宿主 DOM 打关系标记 |
| `protocol.ts` | `skin-manager/src/protocol.ts` | 与皮肤管理器之间的定制声明协议（v2，兼容 v1） |

内联自上游 commit `e916a28d8413b5159917cfe9e0d9f7d407787a3d`，抄录日期 2026-10-01。

## 怎么同步

上游若修改这三个文件，重跑维护工作区的 `sync-upstream-shared.py` 即可
（它会按字节重写这些文件并更新本文件的 commit）。

这个脚本**不在本仓库内**，也不需要它来构建、测试或发布：本仓库对
`Small-tailqwq/dsh-deep-whale` 没有构建期或运行期依赖，`src/vendor/`
只是随包携带的固定副本；只有想采纳上游对这三个文件的新改动时才需要它。

抄录是**按字节复制**，所以 `diff` 任一文件与上游同名文件应当没有差异。

## 为什么内联而不是依赖

- `skin-assets.ts` / `relational-markers.ts` 是约 2 KB / 4 KB 的稳定工具函数；
  上游把它们放在 `shared/` 只是为了两套皮肤共用，并非对外 API。
- `protocol.ts` 是一个**带版本号的线协议**（`SKIN_CUSTOMIZATION_PROTOCOL = 2`）。
  皮肤声明自己用的是 v2，任何支持 v2 的管理器都能驱动它，所以随包携带一份
  固定版本的协议实现是安全的；管理器升级到 v3 时会按协议版本协商，而不是静默失效。
- 代价：上游对这三个文件的修复需要手动同步。它们改动频率很低。
