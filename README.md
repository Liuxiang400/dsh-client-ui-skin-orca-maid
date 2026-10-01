# orca-maid · ORCA MAID 虎鲸女仆

本地派生皮肤：把 ORCA LINK（`orca-link`，作者 Small-tailqwq）的整套框架原样搬过来，
只改身份与亮色主题强调色。直角契约、直线图标重绘、状态角色、四组 16:9 场景、
峰谷定价红绿灯、侧栏舞台与全部交互逻辑都来自上游同一提交。

## 与原皮肤的差异

| 项目 | orca-link | orca-maid |
|---|---|---|
| 包名 | `@smalltailqwq/dsh-client-ui-skin-orca-link` | `@bendix400/dsh-client-ui-skin-orca-maid` |
| 皮肤 id / wiring id | `orca-link` / `ui-skin-orca-link` | `orca-maid` / `ui-skin-orca-maid` |
| CSS 作用域 | `body[data-dsh-orca-link]` | `body[data-dsh-orca-maid]` |
| 资源路由 | `/skin-assets/orca-link/` | `/skin-assets/orca-maid/` |
| CSS 变量前缀 | `--orca-*` | `--maid-*` |
| 亮色强调色 | 暖灰 `#4b483f` | 蓝 `#2563eb`（hover `#1d4ed8`） |
| 美术素材 | 虎鲸 | **暂时沿用虎鲸**，待替换 |

亮色主题只动了强调色与 brand 别名（`--maid-blue`、`--maid-question-focus*`、
`--dsw-alias-brand-*`、`--dsw-alias-button-primary-*`、`--dsw-alias-state-business-*`、
`--dsw-specific-sidebar-nav-item-active-accent`）。刻意**没有**动
`--dsw-static-blue-*` / `--dsw-static-deepseek-*` 这组被上游改写成暖灰的中性纸感色阶，
否则整个亮色界面会一起变蓝。暗色主题本来就是蓝色（`#4d91ff`），未改。

## 安装（本地路径）

```sh
dsh plugin --profile desktop add <本目录绝对路径>
```

与 `orca-link` 互斥：皮肤管理器只允许一套皮肤启用，切换会改写
`~/.dsh/cordis.patch.yml` 与 profile 层的 `dsh-skin managed` 段。

## 构建

```sh
npm install
npm run build   # prepare-skin-assets -> tsdown -> write-skin-build
npm test        # vitest
```

## 换素材

1. 把最终图片按原字节写入 `assets/runtime/<sha256>.<png|webp>`（文件名必须是内容哈希，构建会校验）。
2. 在 `src/client/art.ts` 用 `skinAssetUrl('<sha256>.<ext>')` 引用；删除已无引用的旧文件。
3. 重新 `npm run build`：会重建 `assets/runtime/manifest.json`、`lib/` 与 `skin.build.json`。
4. 角色图集是 **8 列 × 10 行** 正方形格（行序 standby/syncing/working/approval/input/review/complete/fault/offline/ready），
   重画后需要重算 `src/client/status-character.ts` 里的逐帧对齐偏移。

## 许可

代码 MIT、美术资源 CC BY-NC-SA 4.0（禁止商业使用），署名链见 `NOTICE`、
`LICENSE-ARTWORK`。本包是上游美术的衍生作品，上述许可与署名对派生包继续适用。
