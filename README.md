# ORCA MAID · 虎鲸女仆

DeepSeek Harness Web GUI 的皮肤：深海蓝鲸鱼娘女仆，中性画布 + 官方圆角。

- **十态状态角色**：待机 / 同步 / 工作中 / 待授权 / 待输入 / 审阅 / 完成 / 失败 / 离线 / 就绪，
  常驻侧栏顶部，透明图集随状态切换
- **四组 16:9 场景**：亮色「白色工坊」与暗色「夜间书房」各一对，空态 ↔ 工作态 640ms 交叉淡化
- **圆角契约**：沿用宿主官方半径尺度（4 / 8 / 12 / 16 / 20 / 28px），按钮、输入框、卡片、菜单、弹窗、标签、滚动条保持官方圆润；图标沿用宿主官方的 Phosphor 圆润线性图标，不再重绘
- 峰谷定价红绿灯（北京时间）、侧栏舞台、输入框拖拽收起与上滚隐藏、首页标题打字机
- **中性配色**：亮色画布 `#f6f6f6`、白色表面、`#171717` 正文、`#e8e8e8` 发丝边框，强调色为柔和蓝 `#2e86f7`；暗色是独立的中性深灰调色板（非颜色反转），强调色 `#5b9cf8`
- **纯展示层**：不注入服务、不发 Cordis 事件、不触达模型请求；effect 销毁器还原全部 CSS/DOM 写入

## 安装

从 npm：

```sh
dsh plugin --profile desktop add @bendix400/dsh-client-ui-skin-orca-maid
```

从本仓库：

```sh
dsh plugin --profile desktop add <本目录绝对路径>
```

需要皮肤管理器 `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` 才能切换与配置皮肤。
皮肤之间互斥，切换会同时改写 `~/.dsh/cordis.patch.yml` 与 profile 层的 `dsh-skin managed` 段。

## 构建与测试

```sh
npm install
npm run build   # scripts/prepare-skin-assets.mjs -> tsdown -> scripts/write-skin-build.mjs
npm test        # vitest，201 个用例
```

`lib/`、`assets/runtime/manifest.json` 与 `skin.build.json` 是**提交型产物**：
改了源码或素材后必须重新构建并一并提交，否则安装方可执行文件与清单会脱节。

## 自动发布

推送 `v<版本号>` tag 后，`.github/workflows/release.yml` 会依次校验版本、安装锁定依赖、
构建、测试、打包，通过 npm Trusted Publishing（OIDC）发布，再创建 GitHub Release。
Release 包含 npm 版本链接、兼容范围、自动生成的变更记录、同一份 `.tgz` 和 SHA-256 校验文件。
CI 会重新生成构建产物，`skin.build.json.sourceCommit` 指向 tag 的提交；安装成品以 npm / Release 的 `.tgz` 为准。

### npm 一次性设置

打开 [npm 包设置](https://www.npmjs.com/package/@bendix400/dsh-client-ui-skin-orca-maid/access)，
在 **Trusted Publisher** 中选择 **GitHub Actions**，填写：

| 字段 | 值 |
| --- | --- |
| Organization or user | `Liuxiang400` |
| Repository | `dsh-client-ui-skin-orca-maid` |
| Workflow filename | `release.yml` |
| Environment name | 留空（工作流没有使用 environment） |

如果页面显示 Allowed actions，勾选 **Allow npm publish**（直接发布）；仅允许 staged publishing 不够。
无需允许独立的 `npm dist-tag` 操作，也无需创建 `NPM_TOKEN` 或手动配置 GitHub secret。
工作流使用 GitHub 自动提供的 `GITHUB_TOKEN` 创建 Release。
详见 [npm Trusted Publishing 文档](https://docs.npmjs.com/trusted-publishers/)。

### 发布新版本

确保本次改动已整理好；以下以从 `0.1.2` 发布 `0.1.3` 为例：

```sh
npm version 0.1.3 --no-git-tag-version
npm run build
npm test
node --test scripts/release.test.mjs
git add package.json package-lock.json lib/ assets/runtime/manifest.json skin.build.json
git commit -m "chore: release 0.1.3"
git tag -a v0.1.3 -m "Release 0.1.3"
git push origin main
git push origin v0.1.3
```

源码、素材等其他改动也应在打 tag 前提交。tag 必须与 `package.json`、`package-lock.json` 的版本一致。
普通版本发布至 npm `latest`；如 `v0.2.0-beta.1` 的预览版本发布至 `next`，GitHub 标为 Pre-release。
正式版应按递增顺序发布；工作流会拒绝用新发布的旧版本倒退 npm `latest`。

在 GitHub **Actions → Release → Run workflow** 可手动验证安装、构建、测试和打包，**不会发布**。
实际发布只能由版本 tag 的 push 触发。先完成 npm 设置，再推送新版本 tag；不要移动或重推已经发布的版本 tag。

如果发布失败，修正外部设置后使用失败运行的 **Re-run all jobs**。npm 版本已存在时，工作流只有在
安装包 SHA-512 完全一致时才跳过 npm 发布并继续补齐 GitHub Release；不一致则停止，需发布新版本。
已公开的 GitHub Release 附件不会自动覆盖。`v0.1.2` 是接入自动化前的手动发布，保持原样。

## 换素材

素材文件名必须是其内容的 SHA-256，构建会逐个校验，不符即失败。

```sh
# 角色图集：8 列 × 10 行正方形格，行序即上面十态
python3 <workspace>/scripts/swap-art.py status-atlas <新的 8x10 图集.webp>

# 场景：16:9，亮/暗各一对，空态与工作态构图需接近
python3 <workspace>/scripts/swap-art.py light-hero <新的亮色空态.png> --webp
python3 <workspace>/scripts/swap-art.py dark-active <新的暗色工作态.png> --webp

npm run build && npm test
```

换完角色图集后，若新图集是多帧动画，需要重算
`src/client/status-character.ts` 的 `STATUS_FRAME_ALIGNMENT` 与 `FRAME_SEQUENCES`
（当前是每态一张静态姿势，对齐偏移全为 0）。

换应用图标后重新生成 Windows 桌面 ICO：

```sh
python3 scripts/build-desktop-icon.py
```

## 目录

```
src/              插件源码（src/client/* 为浏览器半边，src/index.ts 为 node 半边资源路由）
src/vendor/       内联自上游的共享代码，同步方式见 src/vendor/README.md
scripts/          构建脚本（内联自上游）+ 桌面图标生成
build/            tsdown 客户端打包配置
lib/              提交型构建产物（client.js / index.js）
assets/runtime/   内容哈希命名的素材 + 构建生成的 manifest.json
assets/icons/     桌面快捷方式 ICO
preview/          皮肤管理卡片预览（合成图，非实机截图）
tests/            vitest 用例
```

## 许可

- **代码**：MIT。派生自 ORCA LINK（`Small-tailqwq/dsh-deep-whale` @ 42ecc2a），
  上游共享代码按字节内联于 `src/vendor/`，许可正文见 [LICENSE](LICENSE)。
- **美术**：CC BY-NC-SA 4.0 —— **禁止商业使用**，衍生作品须以相同方式共享。
- 完整署名链见 [NOTICE](NOTICE)：上善无形「溟月」→ ZipZipPipe 女仆装鲸鱼娘 → bendix400。
