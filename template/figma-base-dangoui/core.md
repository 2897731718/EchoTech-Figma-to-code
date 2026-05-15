# CustomUI 核心规则

## 核心翻译原则

**骨架即真相，1:1 还原**：骨架输出什么，翻译结果就对应什么。

翻译规则：
1. **保留原始值**：数值、尺寸、颜色直接使用
2. **翻译每个元素**：包括装饰性元素
3. **透传所有属性**：class、style、尺寸等抽组件时作为 props 透传

判断标准：骨架中的每个节点、属性、数值，都能在翻译结果中找到对应。

**不确定时询问用户**。

---

## 组件库

**包名**：`your-ui-lib`
**前缀**：`Du`（`<Button>` 和 `<Button>` 均可，统一用 `Du` 前缀）

### 组件引入

按需引入，在 `<script setup>` 顶部添加 import，**只引入当前文件实际用到的组件**：

```ts
// 示例：按需引入
import { Button, DuInput, Icon, DuSelect, DuDivider } from 'your-ui-lib'
import { Form, FormItem, DuPopup, DuTag, DuSwitch, DuTextarea, DuUpload } from 'your-ui-lib'
```

---

## 生成规则

1. **宽度不写死**：容器统一用 `w-full`，只有图标、头像等固定尺寸元素保留固定尺寸
2. **单位保留 px**：`gap-[8px]` → `gap-8px`，`rounded-[8px]` → `rounded-8px`（保留 px 后缀）
3. **颜色用 token**：骨架输出 `var(--token, #fallback)` 格式，直接保留即可
4. **动态内容**：静态文字改为 `{{ variable }}`，在 script 中声明对应 `ref`
5. **交互占位**：所有 `@click`、`@change` 加 `// TODO: 实现` 注释的方法
6. **图标名称**：从骨架 INSTANCE 名中提取，转为 kebab-case（`IconArrowRight` → `arrow-right`）
7. **extClass**：需要额外样式时用 `extClass` prop 而不是直接加 class

---

## 布局语义修正

骨架可能未能完整提取布局语义，翻译时按视觉结构判断：

- 一行内 2 个子元素，左边 label、右边 value/icon → 使用 `justify-between`
- 子元素需要撑满父容器 → 使用 `w-full` 或 `flex-1`

---

## 展示行 vs 输入框

核心判断依据是**右侧内容类型**：

| 视觉特征 | 右侧内容 | 应生成 |
|---|---|---|
| label + 「请输入xxx」/「请选择」灰色文字 | placeholder | `FormItem` + `DuInput`/`DuSelect` |
| label + 实际数据（如「李笑笑」「2025年」）+ 可选箭头 | 只读值 | `justify-between` 展示行，整行 `@click` |
| 标题 + 「查看全部 >」 | 操作入口 | `justify-between`，右侧 `@click` |
| 独立输入区域（无 label） | 可编辑 | 直接 `DuInput`，不套 Form |

**重要**：「请输入」「请选择」是 placeholder，用 `DuInput`/`DuSelect` 生成。

---

## Form 结构识别

满足以下条件时用 `Form` 包裹：
- 连续多个 `label + 输入框` 行，且 label 宽度视觉一致
- 或节点名包含 `FormItem`/`Form` 关键词

**规则**：
- `Form` 自带行间分割线，内部不需要手动加 `DuDivider`
- 行间分割线通过 `FormItem` 的 `showBorder` 控制
- 单个输入框或无 label 的输入框直接用 `DuInput`，不套 Form

---

## Icon 类组件

骨架中形如 `Icon***` 的组件（如 `IconAll`、`IconArrowRight`）：

1. 先查 `aliases` 映射
2. 未命中时统一用 `Icon` 替代
3. 图标名推断：`IconArrowHeavyRight` → `<Icon name="arrow-heavy-right" />`

---

## 业务组件 props

骨架中业务组件可能带有 class/style 和 variant 属性：

```html
<SPUBasic spu-png border size="24*32" class="w-[24px] h-[32px]" />
```

处理原则：
- **class/style**：直接透传
- **variant 属性**：根据骨架内容推断作用，无法推断时忽略或询问用户
