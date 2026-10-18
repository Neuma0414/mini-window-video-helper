# NOTICE

本项目（「小窗视频助手」）是一个**修改版**，基于第三方开源项目改编而成。

- **上游项目**：`apades/dmMiniPlayer`（弹幕画中画播放器）
- **上游仓库**：https://github.com/apades/dmMiniPlayer
- **上游基线**：tag `v0.6.15`（源码 tarball，共 324 个文件）
- **上游许可**：CC BY-NC 4.0（署名-非商业性使用）
- **本项目许可**：同样以 **CC BY-NC 4.0** 发布，禁止商业使用。
- **本修改版维护者**：由本仓库维护者（GitHub/Gitee 仓库所有者）持续维护，非原作者 apades。

原作者版权与署名完整保留：上游 `LICENSE` 原文未作删改（19,345 B / 407 行，与 `v0.6.15` tag 逐字节相同），`manifest.json` 中 `author` 仍为 `apades`、`homepage_url` 仍指向上游仓库。本项目为个人非商业用途的改编，不含任何原作者未授权的专有再许可。

> 说明：上游 `package.json` 曾将 `license` 误写为 `"MIT"`，与其 `LICENSE` 文件（CC BY-NC 4.0）矛盾。本项目已按真实的 `LICENSE` 修正为 `CC-BY-NC-4.0`。以 `LICENSE` 文件为准。

## 相对上游的改动（完整清单）

与上游 `v0.6.15` 全树 SHA-256 逐文件比对结果：

| 分类 | 数量 |
|---|---|
| 逐字节相同 | 288 |
| 修改 | 35 |
| 新增 | 4 |
| 删除 | 1 |
| **本地文件合计** | **327**（324 − 1 + 4） |

下表列出**全部 40 个差异文件**。除此之外的每一个文件均与上游逐字节相同。

### A. 功能改动（3）

| # | 文件 | 改动 |
|---|---|---|
| 1 | `src/core/WebProvider/pipAdBar.ts` | **新增**。伪装外壳模块：顶部 48px 绿色栏目头（含「广告」徽标、标题、副标题、装饰 ✕）+ 底部 196px 竖排 3 张信息卡片；`AD_FRAME_TOP/AD_BAR_BOTTOM/AD_FRAME_TOTAL` 常量化；窗口高度 < 404px 自动隐藏；`destroy()` 清理 |
| 2 | `src/core/WebProvider/DocPIPWebProvider.ts` | 画中画窗口高度预算 +244px、播放区 `calc(100% - 244px)`；默认宽度改为 400px；引入尺寸缓存版本号 `v:3` 并区分「用户拖拽」与默认尺寸；弹幕画布下移（CSS 变量 `--docpip-canvas-top`）；`playerEl` 增加 `position: relative`（使弹幕容器以播放器而非视口为锚点）；`html,body` 增加 `height:100%`（`calc()` 百分比参照的前提）与 `overflow:hidden`；外壳上下两段加 `z-index:20` 防弹幕 canvas 覆盖 |
| 3 | `src/shared/storeKey.ts` | `PIP_WINDOW_CONFIG` 存储类型增加可选 `v`（schema 版本），使旧尺寸缓存可失效 |

### B. 元数据与品牌（15）

| # | 文件 | 改动 |
|---|---|---|
| 4 | `src/manifest.ts` | 新增 `minimum_chrome_version: "116"`（Doc PiP 最低版本） |
| 5 | `package.json` | 版本号 `0.6.15` → `0.6.15.1`；`license` 由上游误写的 `"MIT"` 修正为 `CC-BY-NC-4.0` |
| 6–11 | `assets/icon.png`、`icon16.png`、`icon32.png`、`icon48.png`、`icon64.png`、`icon128.png` | 替换为绿色小窗播放主题图标（原为蓝色监视器） |
| 12–18 | `src/locales-ext/{en,zh_CN,zh_TW,es,fr,ja,ko}.json` | 7 个语言包的 `appName` / `appDesc` 统一更名为「小窗视频助手 / Mini Window Video Helper」及对应译文 |

### C. 界面文案（9）

| # | 文件 | 改动 |
|---|---|---|
| 19 | `src/components/FloatButton.tsx` | 版本更新提示增加兜底文案：`env.upgrade_zh/en` 为空时回退到 `t('floatButton.smallUpdate')`，避免空提示；补充 `isHoverLockRef.current = false`，修复悬停锁残留 |
| 20–26 | `src/locales/{en,zh_CN,zh_TW,es,fr,ja,ko}.json` | 7 个语言包新增 `smallUpdate` 键（与上一行配套） |
| 27 | `src/locales/.translated.json` | 同步新增上述键的翻译记录 |

### D. 构建与 CI（7）

| # | 文件 | 改动 |
|---|---|---|
| 28 | `scripts/getChangeLog.mjs` | **新增**。从上游 changelog 抽取本版本更新说明，输出到 `CHANGELOG.txt` 供 Release 正文使用 |
| 29 | `scripts/utils.mjs` | `getChangeLog()` 改为可选链 + 可选调用（无对应条目时返回 `undefined` 而非抛错） |
| 30 | `scripts/tsup.shared.ts` | 类型标注方式调整：`Parameters<typeof defineConfig>[0]` 由变量注解改为 `satisfies`；`getChangeLog()` 调用加 `?.` |
| 31 | `scripts/tsup.build.ts` | 同上类型调整 |
| 32 | `scripts/tsup.dev.ts` | 同上类型调整 |
| 33 | `.github/workflows/release.yml` | 构建增加 `--metafile`；产出 `CHANGELOG.txt`；Release 附件增加 `metafile.json`；设置 `body_path` |
| 34 | `.github/ISSUE_TEMPLATE/bug.md` | 环境信息改为勾选式（OS / 浏览器 / 版本） |

### E. 兼容性修复（1）

| # | 文件 | 改动 |
|---|---|---|
| 35 | `src/shared/env.ts` | `process.env.upgrade_en/zh` 加 `?? ''` 兜底，未注入该环境变量时不再因 `undefined.replace()` 报错 |

### F. 合规与仓库卫生（5）

| # | 文件 | 改动 |
|---|---|---|
| 36 | `NOTICE.md` | **新增**，即本文件 |
| 37 | `THIRD_PARTY_NOTICES.md` | **新增**。第三方组件许可清单（21 个运行时依赖，含 `webextension-polyfill` 的 MPL-2.0 说明） |
| 38 | `readme.md` | 顶部新增「修改版声明」（来源、许可、与原版差异）；安装说明校正；删除签名私钥相关表述；Firefox 标注未实测 |
| 39 | `.gitignore` | 补充 `*.pem`、`*.key`、`*.crx`、`*.zip`、`dist-*/`、`*_extract_*/`、`_crx_body.zip` 等拦截规则与说明 |
| 40 | `src/web-provider/agemys/index.tsx` | **删除**。全仓库无任何引用，属上游遗留死代码 |

**核心播放与弹幕逻辑未改动**，仅调整了画中画容器的尺寸、定位上下文与子元素顺序。

伪装外壳中的「广告」文案、卡片内容均为**虚构的演示数据**，不对应任何真实商品或商业推广，不绑定任何跳转或点击事件；装饰 ✕ 点击亦无任何行为。其用途是**个人非商业的界面外观伪装**，不涉及广告投放或变现，符合 CC BY-NC 4.0 的非商业要求。

## 第三方组件

上游项目依赖并打包了 21 个运行时开源组件（React、lodash、rc-slider、protobuf.js、webextension-polyfill 等），
本项目原样保留，未改动其源代码与授权条款。逐项许可清单见 **`THIRD_PARTY_NOTICES.md`**。

其中 `webextension-polyfill` 采用 **MPL-2.0**（文件级 copyleft），本项目未修改其源文件，不触发公开修改源码的义务，分发时保留其原始许可声明即可。

---

*本文件为署名与修改说明，供合规审阅用；不构成法律意见。*
