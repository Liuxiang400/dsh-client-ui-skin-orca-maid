# ABYSS · 深海终端

DeepSeek Harness 的灰蓝像素皮肤，沿用 ORCA MAID 包名与安装身份。

- **像素角色**：左上角紧凑终端窗口，采用确认后的灰蓝头像；待命、执行、授权、输入、审阅、完成、错误等文字状态来自当前真实会话。共用一张静态头像；头像下方的像素心跳线仅在真实执行状态跳动，后台、待授权、完成或出错时停止，可在外观设置中关闭。
- **首页**：居中的「如切如磋，如琢如磨」像素标题；可切换普通文字，无远程字体请求。
- **终端界面**：灰蓝深浅主题、断角边框、小圆角菜单、侧边几何矩阵与静态扫描纹理；正文保留正常字体。
- **独立设置**：侧栏底部 `▦` → **ABYSS 外观设置**，控制角色、镜像、背景、纹理、像素标题、定价灯与输入框行为；本机浏览器存储，即时生效。
- **生命周期**：不发送模型请求、不改变权限策略。停用时撤销自身 DOM、属性、观察器和监听器；会话流式更新不重建装饰。

## 安装

从 npm：

```sh
dsh plugin --profile desktop add @bendix400/dsh-client-ui-skin-orca-maid
```

从本仓库：

```sh
dsh plugin --profile desktop add <本目录绝对路径>
```

通过 DSH 内置插件管理启用本插件即可；启用前关闭其他皮肤，避免样式叠加。
外观面板的「恢复默认」恢复 ABYSS 默认值。设置按浏览器 / DSH 桌面环境分别保存，
不跨设备同步；存储不可用时会提示仅本次窗口生效。

升级后若新增头像暂未加载，重新启动 DSH，让服务端重新读取素材清单。
从 `0.1.x` 升级后，外观设置使用 ABYSS 默认值，不自动迁移旧管理器配置。
本插件无需旧皮肤管理器；如果其他皮肤仍依赖它，可自行保留，ABYSS 不会卸载它。
已在本机 DSH **0.2.1-rc.5（macOS）** 验证；Windows 等其他平台仍由自动化兼容性回归覆盖，未做实机验收。

## 构建与测试

```sh
npm install
npm run build   # scripts/prepare-skin-assets.mjs -> tsdown -> scripts/write-skin-build.mjs
npm test        # vitest 回归测试
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

确保本次改动已整理好；以下以从 `0.2.0` 发布 `0.2.1` 为例：

```sh
npm version 0.2.1 --no-git-tag-version
npm run build
npm test
node --test scripts/release.test.mjs
git add package.json package-lock.json lib/ assets/runtime/manifest.json skin.build.json
git commit -m "chore: release 0.2.1"
git tag -a v0.2.1 -m "Release 0.2.1"
git push --atomic origin main v0.2.1
```

源码、素材等其他改动也应在打 tag 前提交。tag 必须与 `package.json`、`package-lock.json` 的版本一致。
普通版本发布至 npm `latest`；如 `v0.2.0-beta.1` 的预览版本发布至 `next`，GitHub 标为 Pre-release。
正式版应按递增顺序发布；工作流会拒绝用新发布的旧版本倒退 npm `latest`。

在 GitHub **Actions → Release → Run workflow** 可手动验证安装、构建、测试和打包，**不会发布**。
实际发布只能由版本 tag 的 push 触发。先完成 npm 设置，再推送新版本 tag；不要移动或重推已经发布的版本 tag。

如果发布失败，修正外部设置后使用失败运行的 **Re-run all jobs**。npm 版本已存在时，工作流只有在
安装包 SHA-512 完全一致时才跳过 npm 发布并继续补齐 GitHub Release；不一致则停止，需发布新版本。
已公开的 GitHub Release 附件不会自动覆盖。`v0.1.2` 是接入自动化前的手动发布，保持原样。

## 视觉实现与维护

- `src/client/abyss.module.css`：当前 ABYSS 语义配色、几何背景和组件外观。
- `src/client/abyss.ts` / `pixel-text.ts`：装饰生命周期、首页像素字、英文位图标签。
- `src/client/abyss-preferences.ts`：独立外观面板、浏览器持久化、本地设置校验与默认值。
- `src/client/orca-maid.module.css`：保留宿主布局、平台与历史版本适配；ABYSS 样式最后加载。
- `src/client/status-character.ts`：头像与现有真实会话状态投影。

像素头像是 `art.ts` 中的 `ABYSS_PORTRAIT`。替换素材时把文件以内容 SHA-256 命名放入
`assets/runtime/`，更新 `skinAssetUrl(...)` 引用，再构建。构建校验文件名与内容一致。
旧图集与场景资源保留在仓库用于历史版本追溯，ABYSS 不显示整屏插画。
美术沿用 `LICENSE-ARTWORK` 的署名链与条款。

`preview/abyss-v1/index.html` 是设计草稿，只有示例数据，不连接模型；打包只包含两张卡片预览图。
从 `0.2.0` 起，ABYSS 是唯一持续维护的版本。旧版 `0.1.2` 冻结保留，不再同步新功能或宿主适配。
如需恢复旧外观，可固定安装历史版本：

```sh
dsh plugin --profile desktop add @bendix400/dsh-client-ui-skin-orca-maid@0.1.2
```

旧版沿用当时的管理器依赖与安装条件；仓库中的历史适配代码不代表双版本维护承诺。

## 目录

```
src/              插件源码（src/client/* 为浏览器半边，src/index.ts 为 node 半边资源路由）
src/vendor/       内联自上游的共享代码，同步方式见 src/vendor/README.md
scripts/          构建脚本（内联自上游）+ 桌面图标生成
build/            tsdown 客户端打包配置
lib/              提交型构建产物（client.js / index.js）
assets/runtime/   内容哈希命名的素材 + 构建生成的 manifest.json
assets/icons/     桌面快捷方式 ICO
preview/          皮肤管理卡片预览（设计草稿截图，非实机）与交互设计稿
tests/            vitest 用例
```

## 许可

- **代码**：MIT。派生自 ORCA LINK（`Small-tailqwq/dsh-deep-whale` @ 42ecc2a），
  上游共享代码按字节内联于 `src/vendor/`，许可正文见 [LICENSE](LICENSE)。
- **美术**：CC BY-NC-SA 4.0 —— **禁止商业使用**，衍生作品须以相同方式共享。
- 完整署名链见 [NOTICE](NOTICE)：上善无形「溟月」→ ZipZipPipe 女仆装鲸鱼娘 → bendix400。
