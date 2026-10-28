# Figma AI Coder

[English](./README.md) | [简体中文](./README.zh-CN.md)

把 Figma 设计链接交给 AI 编程 Agent，生成符合当前项目真实组件、规范和工程约束的代码。

Figma AI Coder 不是套用固定模板的一键导出工具。CLI 负责稳定地提取设计上下文并检查当前仓库；Codex 或 Claude Code 再读取真实代码，确认组件 API，把设计翻译为项目已有的写法，修改代码并执行项目检查。

```text
Figma 设计 + 当前代码仓库
             ↓
      确定性的上下文提取
             ↓
       Codex / Claude Code
             ↓
     可审查的项目代码变更
```

## 它能做什么，不能做什么

Figma AI Coder 提供的是“理解仓库后再实现”的工作流，而不是无条件承诺像素级还原的一键设计导出器：

- **它会**提取结构化设计证据、检查目标仓库、安装 Agent 指令，并帮助 Agent 完成一组聚焦且可验证的代码改动。
- **它会**在源码能够证明组件、Token、路由、样式方案和检查命令真实存在时，优先复用这些项目能力。
- **它不会**上传整个仓库、公开内部组件信息，也不会在检查仓库时偷偷执行项目配置。
- **它不会**在没有人工审查的情况下承诺生产级像素还原。缺失素材、交互歧义、过期规则和无法确认的组件映射都会明确暴露出来。

最终产物是目标仓库中的普通源代码。开发者始终通过代码 Diff 决定哪些内容可以提交。

## 为什么架构中需要 AI

每个项目使用的组件、Token、路由、状态管理、无障碍规范和测试方式都不同。CLI 不应该猜测这些工程决策，也不应该假装项目中一定存在通用的 `<Button>` 或 `<Input>`。

CLI 只提供可以验证的事实：

- Figma 的布局、文本、实例、变体、Token 和未解决素材
- 当前仓库的框架、样式方案、候选组件、候选 Token 和已有验证命令
- 项目自己维护的规则，以及可选的显式映射

AI Agent 才是代码实现者。它读取相关源码，确认真实导出和已有用法，选择正确的项目抽象，进行聚焦修改，并验证结果。

## 完整工作流

1. 在目标仓库中执行一次 `npx figma-ai-coder init`。
2. 把 Figma 设计链接以及目标文件或功能告诉 Codex 或 Claude Code。
3. Agent 读取仓库指令，运行 `inspect`，并通过真实源码确认候选组件和 Token。
4. Agent 使用新的输出目录运行 `context`，获得所选 Figma 节点的语义 HTML、结构化清单和诊断信息。
5. Agent 将这些证据映射到项目真实抽象中，修改代码并执行仓库已有检查。
6. 开发者检查代码 Diff、实现假设、未解决素材和验证结果，再决定是否提交。

## 快速开始

要求：Node.js 20+，以及受支持的编程 Agent。`init` 和 `inspect` 不需要 Figma 凭证；只有 `context` 读取设计时需要 Figma Personal Access Token。Token 只在本地设置，不要提交到仓库：

```bash
export FIGMA_PAT="your-figma-personal-access-token"
```

在需要实现设计的目标仓库中初始化：

```bash
npx figma-ai-coder init
```

该命令会安装 Agent 入口，并在 `.figma-ai-coder/` 下创建缺失的项目配置。`init` 永远不会覆盖已经存在的项目文件。

然后直接让 Agent 实现设计。

Codex：

```text
使用 $figma-ai-coder 在 src/pages/Checkout.tsx 中实现这个页面：
https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2
```

Claude Code：

```text
/figma-ai-coder https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2 src/pages/Checkout.tsx
```

Agent 会自动检查仓库、提取 Figma 上下文、审查映射关系、实现页面，并运行最相关的项目检查。

## 直接使用 CLI

也可以直接运行 CLI 来检查或调试每一步：

```bash
# 创建缺失的 Agent 入口和项目配置
npx figma-ai-coder init

# 检查框架、样式、候选组件、Token 和验证命令
npx figma-ai-coder inspect --json

# 从指定 Figma 节点提取语义 HTML 和结构化清单
npx figma-ai-coder context "https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2" \
  --out=.figma-ai-coder/runs/checkout-page

# 诊断鉴权与项目配置
npx figma-ai-coder doctor
```

`inspect` 是静态、只读的仓库检查，不会执行项目配置或脚本。`context` 会把 Figma 文本、节点名、插件数据、注释和适配器输入都视为不可信数据，而不是 Agent 指令。

## 如何适配当前仓库

默认流程不要求开发者先写组件适配器：

1. Agent 读取适用的 `AGENTS.md`、`CLAUDE.md`、目标文件和附近实现。
2. `figma-ai-coder inspect` 给出候选组件文件或包、Token 来源和可用验证命令。
3. `figma-ai-coder context` 把语义设计证据写入一个全新的空目录，而不是冒充最终项目代码。
4. Agent 通过真实导出、类型定义和已有用法验证候选项。
5. Agent 将 Figma 实例映射为现有项目组件；没有可靠抽象时，才回退到原生标签。
6. Agent 完成最小且完整的改动，并执行仓库已有的类型检查、测试或构建命令。

证据采用以下优先级：

```text
项目指令
→ 仓库维护的公司或项目规则
→ 用于验证的当前源码导出和已有用法
→ 明确标注的 AI 推断
→ 原生框架或 HTML 回退实现
```

如果仓库规则已经过期，或者与当前组件 API 冲突，Agent 应报告冲突，而不是静默生成无法运行的代码。

## 项目自己的配置

初始化只会创建缺失文件：

```text
.figma-ai-coder/
├── config.json
├── rules/
│   └── core.md
├── cache/                  自动生成，已忽略
└── runs/                   自动生成，已忽略
```

`config.json` 和 `rules/**` 属于目标仓库。Figma AI Coder 在初始化或升级时不会覆盖它们。生成的上下文和每次运行产物由目录内的 `.gitignore` 忽略。

当项目中存在稳定、重复的映射关系时，可以扩展为：

```text
.figma-ai-coder/
├── adapter.json
└── rules/
    ├── tokens.md
    └── components/
        ├── _catalog.md
        ├── button.md
        └── form.md
```

适配器是可选的精度增强层，不是第一次运行的前置条件。详细流程见[适配内部组件库](docs/component-library-adaptation.md)。

## 内部组件库适配与二次开发

公司内部组件库应先从 Agent 对当前仓库的验证结果开始，只把已经通过源码确认、长期稳定的关系沉淀为规则：

- Figma 中组件的语义名称和变体
- 项目实际导出的组件
- 有效的导入路径
- props、事件、slot 或 children 映射
- Token 映射以及证据位置

判断规则和示例写入 Markdown；组件名、导入路径和属性映射等明确关系写入 `adapter.json`。Agent 使用这些映射前仍必须对照当前源码验证，避免组件升级后继续生成失效代码。

首个版本还没有独立的适配器校验器。不要把自动扫描结果或原始 Figma 响应直接写入适配器。通过这种边界，内部团队可以持续提高翻译准确率，而不需要分叉转换器，也不会把私有组件名发布到公开 npm 包中。

## 安全边界

- Figma Token 只在本地读取，不能打印、提交或复制到生成上下文中。
- 仓库检查会排除依赖、构建产物、秘密文件和工作区之外的路径。
- 项目配置仅做静态解析；检查过程不会导入或执行它。
- Figma 内容和第三方适配器都是不可信输入，不能授权执行命令、安装依赖或写入任意文件。
- 修改目标文件前必须先读取已有实现，并报告实现假设和未解决素材。
- npm 包不会发布仓库源码或私有组件上下文。

## 当前支持范围

公开包提供适用于 React、Vue 和 HTML 工作流的通用 Web 上下文管线。它不会包含私有 UI 库、私有 registry、组织 Token、业务设计或内部平台适配器。

它当前负责提供可靠上下文和 Agent 工作流，不提供独立的可视化映射编辑器、适配器校验服务或完全无人审查的生产发布流程。

## 架构与开发

实现细节见[架构说明](docs/architecture.md)，组件库二次开发见[适配内部组件库](docs/component-library-adaptation.md)。维护者发布版本前应阅读[发布流程](docs/releasing.md)。

从源码运行：

```bash
pnpm install
pnpm typecheck
pnpm test:run
pnpm build
```

## License

[MIT](LICENSE)
