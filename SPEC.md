# figma-to-code 技术规格

## 定位

骨架提取器 + AI 翻译流水线。不直接生成最终业务代码，而是从 Figma 设计稿中提取去噪后的结构骨架，交由 IDE AI 结合项目规范翻译为可用代码。

核心哲学：**确定性的事不让 AI 做。** Auto Layout → flex、间距 → gap、颜色 → hex 这些有明确规则的转换由代码完成，AI 只负责需要"理解"的部分（token 映射、组件识别、交互逻辑）。

---

## 实现原理

### 处理管道

```
Figma REST API
    ↓ getFile(fileKey, { ids, depth: 10 })
原始节点树
    ↓ simplifyNode()           ← 策略一：INSTANCE 剪枝
    ↓                          ← 策略二：透传容器折叠
简化节点树
    ↓ buildComponentTree()     ← 策略三：宽度自适应检测
    ↓ convertNodeToCSS()       ← Auto Layout → flex, fills → bg, strokes → border
    ↓ styleConverter.convert() ← CSS → UnoCSS / class+style / inline
组件树 (ComponentNode)
    ↓ generator.generate()     ← vue / html / react
骨架代码 + instanceComponents 列表
    ↓ AI + figma-context.md
最终业务代码
```

### 阶段 1: 数据获取

- 调用 Figma REST API v1（`api.figma.com`），PAT 认证
- 获取节点树（`GET /files/{fileKey}?ids={nodeId}&depth=10`）
- 可选获取 Variable 定义（`GET /files/{fileKey}/variables`，Enterprise 功能，失败静默降级）
- 内置 429 限流重试（最多 3 次，指数退避）

PAT 读取优先级：`.env.local` → macOS Keychain（`FIGMA_PAT_GLOBAL` / `FIGMA_PAT`）→ 环境变量

### 阶段 2: 节点去噪

三个策略按顺序应用，将 Figma 冗余结构从 ~65 行压缩到 ~30 行：

**策略一：INSTANCE 节点剪枝**

组件实例（INSTANCE / 嵌套 COMPONENT）清空 children，只保留名称 + 尺寸。内部实现是设计细节，不应出现在骨架里。根节点豁免。

```
原始：<IconArrowHeavyRight>
        <div class="bg-[#918b9f] w-[10px] h-[10px]" />  ← 噪音
去噪：<IconArrowHeavyRight class="w-[12px] h-[12px]" />
```

**策略二：透传容器折叠**

Figma Auto Layout 产生的单子节点、无视觉样式的容器直接折叠。判断条件：单可见子节点 + 无 fills + 无 strokes + 无 cornerRadius + 无 padding。

```
原始：<div><div><div><span>年份</span></div></div></div>  ← 三层套娃
去噪：<span>年份</span>
```

**策略三：宽度自适应检测**

构建阶段应用（需要 parent 信息）。当子元素宽度 ≈ 父容器内容宽（±1px）时，删除固定 width/height，让其自然流动。

```
父容器：width=375px, paddingLeft=15, paddingRight=15 → 内容宽=345px
子元素：width=345px → 识别为自适应，省略固定值
```

### 阶段 3: 构建组件树 + CSS 转换

遍历简化后的节点，逐节点执行：

| 模块 | 转换内容 |
|---|---|
| `layout.ts` | Auto Layout → `display: flex` + `flex-direction` + `gap` + `justify-content` + `align-items` + `padding` |
| `styles.ts` | fills → `background-color`，strokes → `border-*`，cornerRadius → `border-radius` |
| `colors.ts` | Figma RGB (0-1) → hex/rgba，支持 Variable 绑定输出 `var(--token, fallback)` |
| `convertTypeStyleToCSS()` | fontSize、fontWeight、lineHeight、letterSpacing、textAlign、textDecoration |
| `calculateConstraints()` | 非 Auto Layout 子节点的 constraints → `position: absolute` + 各方向偏移 |

布局正确性保证：Figma Auto Layout 与 CSS Flexbox 同构，`layoutMode` / `itemSpacing` / `primaryAxisAlignItems` / `counterAxisAlignItems` 直接映射，是确定性转换而非推测。

### 阶段 4: 代码生成

两层可组合的策略模式：

**样式转换器**（StyleConverter 接口）：
- `unocss-converter` — CSS → UnoCSS 工具类（`flex flex-row gap-16`）
- `css-converter` — CSS → class name + `<style>` 块
- `inline-converter` — CSS → `:style="{}"`

**框架生成器**（CodeGenerator 接口）：
- `vue-generator` — `<script setup>` + `<template>` + `<style scoped>`
- `html-generator` — 纯 HTML
- `react-generator` — React 函数组件

INSTANCE 节点生成自闭合标签 + `<!-- figma-node: componentId -->` 注释，用于后续递归。

### 阶段 5: AI 翻译（skill 驱动）

由 `.claude/commands/figma.md` 定义工作流：

1. 调用 CLI 拿到骨架
2. 读取 `.claude/figma-context.md`（项目规范）
3. 按规范翻译：原始值 → token，节点名 → 项目组件，静态文字 → 动态绑定
4. 未匹配的 INSTANCE → 用 `figma-node` id 递归调 CLI → 生成子组件 → 更新映射表

---

## 骨架输出示例

**骨架（中间产物）：**
```html
<div class="flex flex-row gap-[16px] items-center">
  <span class="text-[#000000] text-[16px] font-[400]">年份</span>
  <div class="flex flex-row gap-[4px] items-center">
    <span class="text-[rgba(0,0,0,0.64)] text-[16px]">2025</span>
    <IconArrowHeavyRight class="w-[12px] h-[12px]" /> <!-- figma-node: xxx -->
  </div>
</div>
```

**AI 翻译后（最终代码）：**
```html
<div class="flex items-center justify-between" @click="yearPickerOpen = true">
  <span class="text-b4">年份</span>
  <span class="text-b4 c-text-2 flex items-center gap-4">
    {{ yearLabel }}
    <Icon name="arrow-right" :size="12" />
  </span>
</div>
```

骨架和最终代码的差异集中在四个层面：

| 层面 | 骨架 | 最终代码 | 解决方式 |
|---|---|---|---|
| UnoCSS 单位 | 标准 4px 步长（`px-3.75`） | 项目自定义 1px（`px-15`） | figma-context.md 配置 |
| 设计 token | 原始值（`text-base`） | 语义 token（`text-h4`） | figma-context.md 映射 |
| 组件名称 | Figma 节点名推断（`<Divider5px>`） | 项目组件（`<DuDivider>`） | 业务组件映射表 |
| 动态绑定 | 静态文字（`"2025"`） | `{{ yearLabel }}` + `@click` | AI 手动推断 |

---

## 与 Figma 官方 MCP 对比

Figma 官方 Dev Mode MCP Server 提供 6 个工具，核心是 `get_design_context`，返回：截图 + 参考代码片段 + 元数据。

| 维度 | figma-to-code | Figma 官方 MCP |
|---|---|---|
| **输出物** | 去噪后的 HTML/Vue/React 骨架代码 | 截图 + 单节点参考代码片段 + JSON 元数据 |
| **AI 工作量** | token 替换 + 组件映射 + 加交互 | 理解 JSON → 还原嵌套关系 → 从零写代码 |
| **去噪** | 三层去噪管道 | 无，返回原始结构 |
| **布局转换** | Figma Auto Layout → CSS flex 代码 | 单节点 CSS 属性，不含父子关系 |
| **认证** | PAT（免费用户可用） | OAuth / Dev Mode（需付费 plan） |
| **需要桌面端** | 否（纯 REST API） | 是（通过本地 MCP 与桌面 App 通信） |
| **项目规范** | figma-context.md 固化 | 无，依赖 AI 理解 |
| **子组件递归** | 内置 | 无 |
| **Token 消耗** | 低（去噪压缩后的代码） | 高（原始 JSON + 截图） |

官方 MCP 是"信息通道"——把数据丢给 AI，AI 从零理解并生成。本工具是"预处理器"——在 AI 介入前完成确定性转换，AI 只做语义增强。

---

## 与社区工具对比

### Figma-Context-MCP (Framelink) — 13.8k stars

社区最热门的 Figma MCP 方案。也对 Figma API 返回做简化，但输出的是**结构化描述**（YAML/JSON），不是代码。

**Framelink 输出：**
```yaml
nodes:
  - id: "646:28242"
    name: "Section"
    type: FRAME
    layout: layout_G54OLD
    children:
      - type: TEXT
        text: "Company"
        textStyle: "UI/Label - Large"
styles:
  layout_G54OLD:
    mode: column
    gap: 24px
```

**figma-to-code 输出：**
```html
<div class="flex flex-col gap-[24px]">
  <span class="text-[16px] font-[500]">Company</span>
</div>
```

| 维度 | Figma-Context-MCP (Framelink) | figma-to-code |
|---|---|---|
| **输出** | YAML/JSON 设计描述 | HTML/Vue/React 骨架代码 |
| **AI 要做的** | 理解描述 → 从零写代码 | 读骨架 → token 替换 + 语义增强 |
| **去噪方式** | 过滤不可见节点、样式去重、SVG 折叠 | INSTANCE 剪枝 + 透传折叠 + 宽度自适应 |
| **布局转换** | 转成 CSS flex 术语但**不生成代码** | **直接生成 CSS class** |
| **框架** | 无（框架无关） | vue / html / react |
| **样式模式** | 无（只描述） | unocss / css / inline |
| **项目规范** | 无 | figma-context.md |
| **子组件递归** | 无（只记录 componentId） | 有，自动递归 + 更新映射表 |
| **运行形态** | MCP server（常驻） | CLI（按需调用） |
| **依赖** | 有 npm 依赖 | 零运行时依赖 |

Framelink 的优势：框架无关适用面广、样式去重更紧凑（比官方 MCP 小 25%）、保留 Figma 样式名称、MCP 生态集成好。

figma-to-code 的优势：AI 工作量更小、项目规范可固化复用、子组件递归生成渐进积累、输出确定性更高、更轻量。

### FigmaToCode (bernaferrari) — 4.8k stars

架构最接近。核心是 AltNode 中间表示层——Figma 节点 → 自定义中间格式 → 去噪优化 → 多框架生成。区别：它是 Figma 插件（需在 Figma 内运行），且试图直接出最终代码而不借助 AI 做项目适配。

### Builder.io Visual Copilot — 商业产品

三段式：专用 AI 模型做结构转换 → Mitosis 编译器（13k stars，开源）跨框架转译 → LLM 做适配。去噪部分闭源。

---

## 项目优势总结

**1. 分层架构** — 确定性转换（Figma → CSS/HTML）交给代码，语义理解（token、组件、交互）交给 AI，各做擅长的事。

**2. 去噪压缩** — 三层去噪将 ~65 行压到 ~30 行，AI 输入越精准，幻觉越少，输出越稳定。

**3. 项目规范可固化** — `figma-context.md` 一次配置持续复用，不同人/对话/AI 工具读到同一份规范，生成一致性有保障。

**4. 子组件递归** — INSTANCE 标注 `figma-node` id → skill 自动递归 → 生成子组件 → 更新映射表。渐进式积累，用得越多效率越高。

**5. 布局正确性有数据保证** — Figma Auto Layout 与 CSS Flexbox 同构，字段直接映射，是确定性转换而非 AI 看图猜测。

**6. 零依赖低门槛** — 零运行时 npm 依赖，只需 PAT（免费），CLI 按需调用，不绑定特定 IDE。

**7. 可扩展** — 框架（vue/html/react）、样式（unocss/css/inline）、组件库（template/ 加模板）、skill（按场景拆分）均可扩展。

---

## Code to Design 的场景与技术

### 为什么有了 Design to Code 还需要反向？

Design to Code 是主流方向（设计先行），但以下场景需要 Code → Design：

**场景一：先有代码，后要设计稿**

开发先行的团队（特别是创业公司），代码先上线，设计师后续入职或后期介入，需要拿到现有页面的 Figma 稿作为统一视觉规范的起点。手动重画太慢，Code to Design 让设计师直接拿到可编辑的 Figma 文件。

**场景二：设计系统反向同步**

组件库由开发维护，代码侧新增了组件 variant（如 Button 加了 `size="xl"`），设计师的 Figma 组件库需要同步更新。Anima / Storybook → Figma 可自动完成，避免两边手动维护不一致。

**场景三：AI 生成 → 设计师精修**

非设计师（产品/开发）用 Lovable / Magic Patterns 等 AI 工具快速生成页面，导出 Figma 交给设计师调细节（间距、颜色、对齐），调完后再 Design to Code 生成最终版。Figma 在这里是精修工具，不是起点。

**场景四：竞品分析**

打开竞品网站 → html.to.design 抓取 → 拿到可编辑的 Figma 稿，在此基础上改成自己的风格。比截图好用得多。

### Code to Design 三条技术路线

**路线一：抓渲染结果（主流）**

代表：html.to.design、Builder.io figma-html

```
代码 → 浏览器渲染 → 遍历 DOM + getComputedStyle() → 创建 Figma 节点
```

CSS → Figma 属性映射（本质是 Design to Code 的反向）：

| CSS | Figma |
|---|---|
| `display: flex; flex-direction: row` | Frame + `layoutMode: HORIZONTAL` |
| `gap: 16px` | `itemSpacing: 16` |
| `justify-content: space-between` | `primaryAxisAlignItems: SPACE_BETWEEN` |
| `background: #fff` | fills: `[{ type: SOLID }]` |
| `border-radius: 8px` | `cornerRadius: 8` |
| `box-shadow: ...` | effects: `[{ type: DROP_SHADOW }]` |

通用性好（任何网页都能抓），但丢失组件语义和交互逻辑。还原度约 80-90%。

**路线二：组件级同步（最精准）**

代表：Anima (Storybook → Figma)

```
Storybook 组件 → 读 props 定义 + 渲染各状态 → 创建 Figma Component + Variants
```

不抓网页，读组件源码元信息。Props 映射为 Figma Component Properties，多个 prop 组合生成 Variants。保留组件语义，但只对设计系统组件有效。

**路线三：代码直接描述 Figma 节点**

代表：react-figma（开源）

```jsx
import { Frame, Text } from 'react-figma'
<Frame style={{ flexDirection: 'row', gap: 16 }}>
  <Text style={{ fontSize: 16 }}>年份</Text>
</Frame>
```

React 自定义渲染器，JSX 渲染目标是 Figma 节点。精确控制但需专用 API 重写，采用率低。

### Design ↔ Code 双向循环的现状

理想中：`Code → Design → Code → Design → ...` 每一圈不丢信息。

现实：每一程转换都是有损压缩。

```
Code 的信息维度：结构 + 样式 + 交互 + 状态 + 数据绑定 + 业务逻辑
                    ↓ Code → Design（只保留结构 + 样式）
Design 的信息维度：结构 + 样式
                    ↓ Design → Code（AI 猜测补回交互/状态/逻辑）
Code 的信息维度：结构 + 样式 + AI 猜的交互 + AI 猜的状态 + ...
```

**完全自动的双向循环目前不存在。** 所有工具做的都是单向转换 + 手动补偿。

业界尝试的解法：
- **组件映射（Figma Code Connect）** — 不做转换，做绑定。Figma 组件 ↔ 代码组件一一对应。只对设计系统组件有效。
- **单一真相源（UXPin Merge）** — 代码组件直接在设计工具画布上渲染，不存在转换。但限制设计自由度。
- **中间映射表（figma-context.md）** — 不追求自动循环，用人工维护的映射表做桥梁，渐进积累。务实可用。

---

## 当前局限

- **图标无法还原** — Figma vector 节点只能拿到尺寸和颜色，无法得知具体图标
- **占位内容** — 输入框 placeholder、下拉框选项来自组件内部，骨架中为空
- **交互逻辑** — v-model、@click、接口调用无法从 Figma 推断，需手写
- **响应式** — Figma 画布是固定尺寸，响应式断点需人工判断
- **非 Auto Layout** — 设计师手动拖放（无 layoutMode）时只能输出绝对定位，不如 flex 语义化
