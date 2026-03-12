# figma-to-code 架构设计

## 定位

**不是**一个直接生成可运行代码的工具。

**是**一个结构骨架提取器——从 Figma 设计稿中提取层级结构、间距信息、组件实例名称，生成供 AI 进一步翻译的参考模板。

---

## 整体链路

```
Figma Link
    ↓
figma-to-code（本工具）
→ 结构骨架：层级 + 间距 + 组件实例名 + 文字内容

    ↓
IDE AI（Claude / Cursor 等）+ 项目上下文
→ 识别项目组件库、token 系统、命名规范
→ 将骨架翻译为真实可用代码

    ↓
自动生成的 skill 文件
→ 将项目规则固化为 prompt，下次直接复用
```

骨架的价值不在于"可直接运行"，而在于为 AI 提供**准确的结构参考和间距数字**，避免 AI 凭空猜测布局。

---

## 核心模块

```
src/
├── api/
│   ├── client.ts        # Figma REST API 封装
│   └── types.ts         # Figma 节点类型定义
├── converter/
│   ├── index.ts         # 主入口：convertFigmaToCode()
│   ├── tree-builder.ts  # Figma 节点树 → ComponentNode 树
│   ├── layout.ts        # Auto Layout → flex CSS
│   ├── styles.ts        # 填充/描边/圆角 → CSS
│   ├── colors.ts        # 颜色格式转换
│   ├── unocss/
│   │   ├── converter.ts # CSS → UnoCSS 工具类
│   │   └── mappings.ts  # 各属性的转换规则
│   ├── styles/
│   │   ├── css-converter.ts     # CSS 模式：输出 class + <style>
│   │   ├── unocss-converter.ts  # UnoCSS 模式：内联工具类
│   │   └── inline-converter.ts  # 行内 style 模式
│   └── generators/
│       ├── vue-generator.ts     # 输出 Vue SFC
│       ├── html-generator.ts    # 输出纯 HTML
│       └── react-generator.ts   # 输出 React 组件
└── pat/
    └── reader.ts        # 读取 Figma PAT（环境变量 / Keychain）
```

---

## 骨架去噪：三个策略

Figma 的原始节点结构包含大量对代码无意义的噪音，转换前需要做简化处理。

### 策略一：INSTANCE 节点不展开子节点

INSTANCE 是组件实例，内部实现是设计细节，不应出现在骨架里。

```
原始：
<IconArrowHeavyRight>
  <div class="bg-[#918b9f] w-[10px] h-[10px]" />  ← 噪音

去噪后：
<IconArrowHeavyRight class="w-[12px] h-[12px]" />
```

实现位置：`simplifyNode()` 预处理阶段，遇到 INSTANCE 直接清空 children。

### 策略二：透传容器折叠

Figma 的自动布局会产生大量只有一个子节点、没有任何视觉样式的容器，对代码无意义。

判断条件：单子节点 + 无填充 + 无描边 + 无圆角 + 无 padding

```
原始（Figma 自动布局产生的三层套娃）：
<div class="flex flex-col justify-center w-[274px] h-[24px]">
  <div class="flex flex-row items-center w-[274px] h-[24px]">
    <span>年份</span>
  </div>
</div>

去噪后：
<span>年份</span>
```

实现位置：`simplifyNode()` 递归处理完 children 后，检查是否满足折叠条件。

### 策略三：宽度自适应检测

当元素宽度 ≈ 父容器内容宽（减去 padding）时，不输出固定宽度，让其自然撑满。

```
父容器：width=375px，paddingLeft=15，paddingRight=15 → 内容宽=345px
子元素：width=345px → 识别为 w-full，省略固定值

原始：w-[345px] w-[375px]（满屏幕都是固定宽）
去噪后：省略宽高，让布局自然流动
```

实现位置：`buildComponentTree()` 构建阶段，在转换 CSS 时检测父子宽度关系。

### 处理管道

```
Figma 原始节点树
      ↓
  simplifyNode()          策略一 + 策略二（预处理）
      ↓
  buildComponentTree()
    └─ 策略三（构建时，需要 parent 信息）
      ↓
  骨架模板
```

三个策略叠加后，同一段内容从 ~65 行压缩到 ~30 行：

```html
<!-- 去噪前 -->
<div class="flex flex-row gap-4 items-center w-[345px] h-[24px]">
  <div class="flex flex-col gap-0.5 justify-center w-[274px] h-[24px]">
    <div class="flex flex-row gap-0.5 items-center w-[274px] h-[24px]">
      <span class="text-black text-base font-normal leading-6 text-left w-[32px] h-[24px]">年份</span>
    </div>
  </div>
  <div class="flex flex-row gap-1 items-center w-[55px] h-[22px]">
    <span class="text-[rgba(0, 0, 0, 0.64)] ...">2025</span>
    <IconArrowHeavyRight class="w-[12px] h-[12px]">
      <div class="bg-[#918b9f] w-[10px] h-[10px]" />
    </IconArrowHeavyRight>
  </div>
</div>

<!-- 去噪后 -->
<div class="flex flex-row gap-4 items-center">
  <span>年份</span>
  <div class="flex flex-row gap-1 items-center w-[55px] h-[22px]">
    <span class="text-[rgba(0, 0, 0, 0.64)] ...">2025</span>
    <IconArrowHeavyRight class="w-[12px] h-[12px]" />
  </div>
</div>
```

---

## 骨架 vs 最终代码的差异

对比工具生成的骨架和实际手写代码，差异主要在四个层面：

| 层面 | 骨架输出 | 实际代码 |
|---|---|---|
| **UnoCSS 单位** | 标准 4px 步长（`px-3.75`）| 项目自定义 1px 步长（`px-15`）|
| **设计 token** | 原始值（`text-base font-medium`）| 语义 token（`text-h4 fw-500`）|
| **组件名称** | Figma 节点名推断（`<Divider5px>`）| 项目组件库（`<DuDivider>`）|
| **动态绑定** | 静态文字（`"2025"`）| 动态绑定（`{{ yearLabel }}`）|

前三项可以通过**项目级 skill 配置**解决，最后一项（交互逻辑）需要手写。

---

## skill 文件设计

为每个项目生成一份约定文件，供 AI 在翻译骨架时参考：

```markdown
# 项目：xxx

## 组件库
- 前缀：Du*（DuInput、Button、DuDivider、Icon）
- 图标：<Icon name="xxx" :size="12" />
- 分割线：<DuDivider class="my-16" />
- 输入框：<DuInput v-model:value="xxx" placeholder="请输入" bordered />

## UnoCSS 配置
- 间距单位：1unit = 1px（px-15 = 15px，gap-8 = 8px）
- 颜色 token：c-text-2（次要文字）、bg-hex-F7F7F9（页面背景）
- 文字 token：text-h4（标题）、text-b4（正文 16px）、text-b5（小字 14px）

## 生成规则
- 宽高不写死，用 w-full 或自然流
- 交互元素加 @click / v-model 占位
- Figma 骨架中的 IconXxx → Icon，name 从节点名推断
- 骨架中 FormItem / InputFrame → DuInput
```

---

## 当前局限

- **图标无法还原**：Figma vector 节点只能拿到尺寸和颜色，无法得知是什么图标
- **占位内容**：输入框 placeholder、下拉框选项等来自组件内部，骨架中为空
- **交互逻辑**：v-model、@click、接口调用无法从 Figma 推断，永远需要手写
- **响应式**：Figma 画布是固定尺寸，响应式断点逻辑需要人工判断

---

## 使用方式

```bash
# 安装
pnpm install

# 运行集成测试（需配置 Figma PAT）
FIGMA_URL="https://www.figma.com/design/xxx/..." pnpm test:run tests/integration.test.ts

# PAT 配置方式（任选一）
# 1. .env.local 写入 FIGMA_PAT=xxx
# 2. macOS Keychain: security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "xxx"
```

```ts
import { convertFigmaToCode } from 'figma-to-code'

const result = await convertFigmaToCode({
  fileKey: 'xxx',
  nodeId: '123:456',
  framework: 'vue',
  styleFormat: 'unocss',
})

console.log(result.code)
```
