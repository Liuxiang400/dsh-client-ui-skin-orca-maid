# ORCA MAID · 虎鲸女仆

DeepSeek Harness Web GUI 的皮肤：深海蓝鲸鱼娘女仆，配上直角机能框架。

- **十态状态角色**：待机 / 同步 / 工作中 / 待授权 / 待输入 / 审阅 / 完成 / 失败 / 离线 / 就绪，
  常驻侧栏顶部，透明图集随状态切换
- **四组 16:9 场景**：亮色「白色工坊」与暗色「夜间书房」各一对，空态 ↔ 工作态 640ms 交叉淡化
- **直角契约**：按钮、输入框、卡片、菜单、弹窗、标签、滚动条圆角归零，宿主图标在运行时重绘为直线图形
- 峰谷定价红绿灯（北京时间）、侧栏舞台、输入框拖拽收起与上滚隐藏、首页标题打字机
- 亮色强调色为蓝 `#2563eb`，暗色为 `#4d91ff`
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
npm test        # vitest，203 个用例
```

`lib/`、`assets/runtime/manifest.json` 与 `skin.build.json` 是**提交型产物**：
改了源码或素材后必须重新构建并一并提交，否则安装方可执行文件与清单会脱节。

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
