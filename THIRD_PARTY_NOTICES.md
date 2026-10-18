# 第三方组件声明（THIRD_PARTY_NOTICES）

本项目基于 `apades/dmMiniPlayer` 改编，其构建产物中包含以下第三方开源组件。
这些组件均由上游项目引入，本项目**未修改其源代码**，仅随构建产物一并分发。
各组件版权归其作者所有，并遵循其各自的许可条款。

下表的许可类型直接读取自 `node_modules/<pkg>/package.json` 的 `license` 字段，
未作推测。除特别说明外，这些许可均允许再分发。

## 运行时依赖（进入 `dist/` 产物）

| 组件 | 版本 | 许可 |
|---|---|---|
| `@ant-design/icons` | ^4.3.0 | MIT |
| `@apad/rc-slider` | ^10.5.0 | MIT |
| `@apad/setting-panel` | ^0.2.2 | MIT |
| `ahooks` | ^3.7.8 | MIT |
| `ass-compiler` | ^0.1.11 | MIT |
| `bilibili-live-ws` | ^6.3.1 | MIT |
| `chalk` | ^5.3.0 | MIT |
| `classnames` | ^2.3.2 | MIT |
| `color` | ^4.2.3 | MIT |
| `fast-deep-equal` | ^3.1.3 | MIT |
| `mitt` | ^3.0.1 | MIT |
| `mobx` | ^6.9.0 | MIT |
| `mobx-react` | ^7.6.0 | MIT |
| `node-html-parser` | ^6.1.13 | MIT |
| `pako` | ^2.1.0 | MIT AND Zlib |
| `react` | 18.2.0 | MIT |
| `react-dom` | 18.2.0 | MIT |
| `react-draggable` | ^4.4.6 | MIT |
| `uuid` | ^9.0.0 | MIT |
| `webext-bridge` | ^6.0.1 | MIT |
| `webextension-polyfill` | ^0.10.0 | **MPL-2.0** |

## 构建期依赖（仅开发使用，不随扩展分发）

包括但不限于：`typescript`、`tsup`、`esbuild`、`vite`、`tailwindcss`、`postcss`、
`autoprefixer`、`eslint`、`prettier`、`@mui/material`、`@emotion/react`、
`@types/*` 等。这些依赖不出现在 `dist/` 产物中，无需随分发附带许可声明。

## 重要说明

### 1. MPL-2.0 组件（`webextension-polyfill`）

该组件采用 **Mozilla Public License 2.0**，属文件级弱copyleft：

- MPL-2.0 允许你以任意许可使用其代码，**包括闭源商用**，但要求：
  - 保留该组件原有的许可声明；
  - **若你修改了它的源文件**，须以 MPL-2.0 提供被修改的源文件。
- 本项目**未修改** `webextension-polyfill` 的源代码，仅原样使用，
  因此不触发"公开被修改源码"的义务。分发时其原始许可声明应予保留。

### 2. 许可声明未内嵌于构建产物

构建过程由打包器（esbuild / tsup）执行，其**压缩阶段会剥离源文件中的注释**，
因此上述组件的许可声明未保留在 `dist/*.js` 内。这是打包器的默认行为，
非本项目有意为之。上表即为此提供了集中声明。

若需要完全合规的许可内嵌，建议引入 `rollup-plugin-license` 一类的插件，
或在各组件对应的 chunk 头部手工保留许可注释。

### 3. 逐项核实方式

```bash
# 列出全部依赖及其许可
pnpm licenses list --prod
```

或执行以下命令直接读取某个组件的许可字段：

```bash
node -p "require('./node_modules/<组件名>/package.json').license"
```

各组件许可全文见其上游仓库根目录的 `LICENSE` 文件。

---

*本清单依据实测数据整理，不构成法律意见。如与各组件官方仓库声明不一致，以官方仓库为准。*