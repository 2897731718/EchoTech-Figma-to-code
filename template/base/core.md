---
name: 核心翻译规则基模板
description: 定义骨架到代码的通用翻译规则和检查清单
type: base
---

# 核心翻译规则

通用规则，适用于所有组件翻译。各框架在 `{framework}/core.md` 补充框架特有规则。

---

## 组件识别

| 骨架前缀 | 含义 | 处理方式 |
|---|---|---|
| `💙` | 原子分子组件 | 查 `components/_catalog.md` aliases → 使用对应组件 |
| `👻` | 业务组件 | 查 `business/_catalog.md` → import 或递归生成 |
| 无前缀 | 原子元素 | 按 data-type 翻译为 HTML 或组件 |

---

## 💙 前缀组件

骨架中 `💙` 前缀的 INSTANCE 节点：

1. 查 `_catalog.md` aliases 表
2. **有映射** → 使用对应组件
3. **无映射** → 按骨架子节点 1:1 创建组件

### 节点名解析规则

从 `data-name` 提取关键词进行匹配：

**提取规则**：
1. 去掉 `💙` 前缀和编号（如 `01.01_`、`00.03_`）
2. 如有 `/`，取第一段作为组件名
3. 空格转 PascalCase（`Navigation Bar` → `NavigationBar`）

### 匹配流程

1. 用提取的关键词查 `_catalog.md` aliases 表
2. aliases 命中 → 获取组件名
3. 用组件名查 components 表 → 获取规则文件
4. **读取规则文件**，按 props、slots、示例翻译

### aliases 未命中处理

| 情况 | 处理方式 |
|---|---|
| 关键词包含已知组件名 | 模糊匹配 |
| 关键词是已知组件变体 | 取父组件，未命中则询问 |
| 装饰性/系统元素 | 直接翻译为 HTML/CSS |
| 完全未匹配 | 询问用户 |

**判断「装饰性/系统元素」**：节点不承载交互、不需要响应式数据、仅用于视觉呈现。

---

## 👻 前缀组件

骨架中 `👻` 前缀的 INSTANCE 节点，为业务组件。

**流程**：
1. 查 `business/_catalog.md` 是否有记录
2. 有记录 → 直接 import 使用
3. 无记录 → 询问用户是否生成，确认后递归翻译

---

## 节点类型处理

| data-type | 场景判断 | 处理方式 |
|---|---|---|
| `TEXT` | — | 保留文本，绑定变量 |
| `FRAME` | — | 容器，保留布局样式 |
| `GROUP` | 子节点全是 VECTOR/RECTANGLE | 整体视为图标/装饰，替换为 SVG 或删除 |
| `GROUP` | 子节点含 TEXT/FRAME | 普通分组，保留或展开 |
| `ICON` | — | 替换为项目图标组件 |
| `INSTANCE` / `COMPONENT` / `COMPONENT_SET` | — | 按映射表查找组件 |
| `VECTOR` | 在 GROUP 内 | 随父级 GROUP 整体处理 |
| `VECTOR` | 独立 + 有 border 样式 | 用 CSS border 实现（如选中态边框） |
| `VECTOR` | 独立 + 纯填充 | 装饰元素，通常可删除 |
| `RECTANGLE` | 有 `figma-image:unknown` | 替换为图片组件 |
| `RECTANGLE` | 名字含 `Border` | 合并到父容器 border 样式 |
| `RECTANGLE` | 其他纯色块 | 用 CSS background 实现 |
| `ELLIPSE` | — | 用 `rounded-full` 实现 |

---

## 组件映射判断流程（按优先级）

**第一层：emoji 前缀识别**

| Figma 原名前缀 | 走哪个映射表 | 说明 |
|---|---|---|
| `👻` | `business/_catalog.md` | 业务组件 |
| `💙` | `components/_catalog.md` aliases | 原子分子组件 |
| 无 emoji | 尝试 `business/_catalog.md` aliases | 业务组件或未分类 |

**第二层：映射表查询**

| 映射表状态 | 处理方式 |
|---|---|
| 有路径记录 | 直接 import 对应组件，不递归 |
| 有路径 `-` | 使用原生组件，不递归 |
| 无记录 | 询问用户是否生成 |

> **注意**：`components/_catalog.md` aliases 是模糊匹配，`business/_catalog.md` 是精确匹配前缀。

---

## 具体翻译规则

- INSTANCE 标签 → 按 emoji 判断走对应映射表，映射为项目真实组件
- COMPONENT_SET 子节点（变体）：优先用**父级名称**映射，子节点名作为 props 传递
  - 例：`💙 01.00_Status Bar` 的子节点 `ColorDefaultTypeiPhone5s` → `StatusBar` + `type="iPhone5s"`
  - 变体名中含 `ColorDefault`/`ColorWhite` → 提取为 `color` prop
- `data-type="ICON"` → 替换为项目图标方案
- 原始color/typography/icon/spacing/margin/padding/radius/shadow → 替换为项目 token
- 容器宽度 → 改为全宽
- 静态文字 → 改为变量绑定，交互元素加事件占位

---

## 样式规则

| 骨架样式 | 翻译方式 |
|---|---|
| `class="..."` | 保留原始 class |
| `:style="{ ... }"` | 保留内联 style |
| 根容器固定宽度 | 改为全宽 |
| `figma-image:unknown` | 替换为图片组件或 props 占位 |

---

## Import 规则

每个 `.vue` 文件必须包含完整的 import 语句。

| 使用场景 | import 来源 |
|---|---|
| 原子分子组件 | `import { DuXxx, DuYyy } from 'your-ui-lib'` |
| 本地子组件 | `import XxxComponent from './XxxComponent.vue'` |
| Vue API | `import { ref, computed } from 'vue'` |

**检查清单**：翻译完成后，扫描 template 中所有组件标签，确保都有对应 import。

---

## Props 透传

抽取子组件时，骨架中的动态值（文本、数值、颜色）应作为 props 透传。

```html
<!-- 骨架中多个相似结构 -->
<ChildComponent>
  <span>文本内容</span>
  <Badge>数值</Badge>
</ChildComponent>

<!-- 翻译为带 props 的组件 -->
<script setup lang="ts">
defineProps<{
  text?: string
  count?: number
}>()
</script>

<template>
  <div class="...">
    <span>{{ text }}</span>
    <Component v-if="count">{{ count }}</Component>
  </div>
</template>
```

---

## 处理未识别的子组件（递归生成）

翻译完成后，检查骨架中所有带 `<!-- figma-node: xxx -->` 注释的标签，按 emoji 前缀分类处理：

### 💙 前缀节点（原子分子组件）

未命中 `components/_catalog.md` aliases 时：
- 是否需要生成？ → 用 CLI 获取骨架，按规则翻译
- 或输入「跳过」→ 保留占位标签

### 👻 前缀节点（业务组件）

未命中 `business/_catalog.md` 时：
- 是否需要生成？如需要，请告知保存路径。

**用户确认路径后**：
- 用该组件的 `figma-node` id 重新执行 CLI
- 对新骨架重复翻译流程
- 将结果写入用户指定路径
- 在 `business/_catalog.md` 补充记录
- 回到主组件，将对应标签替换为真实组件，补充 import

**用户跳过** → 保留占位标签，不处理

---

## 翻译检查

完成后逐项核对：

| 检查项 | 确认方式 |
|---|---|
| 骨架每个节点 → 翻译结果有对应 | 逐节点比对 |
| 翻译每个元素 → 骨架有来源 | 无自创逻辑/props |
| 💙 节点 → 查了 _catalog | 有映射用组件，无映射按骨架创建 |
| 👻 节点 → 查了 business/_catalog | 有记录 import，无记录递归生成 |
| class/style → 保留骨架原值 | 不改颜色/尺寸 |
| import → 完整 | 组件都有 import |