# figma-to-code

把 Figma 设计稿转换为可继续开发的前端骨架代码，并为 Codex、Claude Code 提供可复用的设计稿还原规则。

这个项目不追求“一键生成最终页面”。它更适合完成最耗时、最机械的第一步：读取 Figma 节点，保留布局、文本、图片、组件层级和常见设计语义，再由开发者或编码 Agent 接手业务逻辑和工程集成。

## 主要能力

- 通过 Figma REST API 读取指定页面或节点
- 生成 Vue、React 或 HTML 骨架
- 识别 Auto Layout、Grid、`flex-wrap`、HUG/FILL、padding 和绝对定位
- 折叠实例并保留文本覆盖、嵌套实例和图标语义
- 自动检测 UnoCSS、Tailwind CSS 或传统 CSS 项目
- 扫描现有项目的 CSS token，减少生成代码中的硬编码值
- 安装 Codex Skill 和 Claude Code slash command
- 支持自定义规则层：基础规则、业务规则和 UI 库规则

## 环境要求

- Node.js 20+
- pnpm 10+
- 一个具有目标文件读取权限的 Figma Personal Access Token

## 从源码安装

```bash
git clone https://github.com/2897731718/EchoTech-Figma-to-code.git
cd EchoTech-Figma-to-code
pnpm install
pnpm build
pnpm link --global
```

设置 Figma Token：

```bash
export FIGMA_PAT="your-figma-personal-access-token"
```

也可以在当前项目中创建 `.env.local`：

```dotenv
FIGMA_PAT=your-figma-personal-access-token
```

不要提交包含 Token 的环境文件。

## CLI 使用

```bash
# 初始化 Agent 规则
figma-to-code init

# 生成 Vue 骨架
figma-to-code "https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2"

# 生成 React 骨架
figma-to-code "https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2" \
  --framework=react \
  --output=src/components/Example.tsx

# 查看帮助
figma-to-code --help
```

常用选项：

| 选项 | 说明 |
| --- | --- |
| `--framework=vue\|react\|html` | 输出框架，默认 `vue` |
| `--style=auto\|unocss\|css\|inline` | 样式模式，默认自动检测 |
| `--output=<path>` | 把结果写入文件 |
| `--ui=<name>` | 选择 `template/<name>` 下的 UI 规则 |
| `--tokens=<name>\|none` | 读取可选 token 映射 |
| `--fold-prefixes=<prefixes>` | 只折叠匹配前缀的实例 |
| `--no-fold-prefixes=<prefixes>` | 不折叠匹配前缀的实例 |

## 在 Codex 中使用

在目标项目执行：

```bash
figma-to-code init
```

命令会安装 `.agents/skills/figma-to-code/SKILL.md`。之后可以在 Codex 中直接描述任务，例如：

```text
使用 $figma-to-code，根据这个 Figma 节点实现 React 页面：
https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2
```

Skill 会先调用 CLI 提取结构化骨架，再结合当前代码库的组件、样式和业务约束完成实现。

## 自定义规则

`figma-to-code init` 会在 `.claude/figma-base/` 下生成可编辑的规则文件：

```text
.claude/figma-base/
├── core.md
├── components.md
└── business.md
```

你也可以在仓库的 `template/<ui-name>/` 中维护团队规则，然后通过 `--ui=<ui-name>` 初始化或生成。

## 开发

```bash
pnpm install
pnpm typecheck
pnpm test:run
pnpm build
```

更多实现细节见 [架构说明](docs/architecture.md)。

## 开源版边界

公开仓库专注于通用 Web 生成能力。团队内部 token、私有 UI 库规则、私有 Registry 配置和特定业务平台适配不会同步到公开仓库。

## License

[MIT](LICENSE)
