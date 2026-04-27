# 项目 Figma 规范 - React

> 此文件由 `figma-to-code init --ui=react` 生成。
> 组件库规则在 `.claude/figma-base/` 目录，可通过 `figma-to-code update` 更新。

---

## 组件库

<!-- 填写：组件前缀、包名 -->
**包名**：`@your-ui/react`
**前缀**：无（如 `<Button>`）

### 组件引入

按需引入，在文件顶部添加 import，**只引入当前文件实际用到的组件**：

```tsx
// 示例：按需引入，不要全量引入
import { Button, Input, Icon, Select, Divider } from '@your-ui/react'
```

---

## 业务组件映射

<!--
骨架中未识别的 INSTANCE 节点会附带 {/* figma-node: xxx */} 注释。
翻译时按本表决策，三种情况：
  1. 文件路径为 "-"  → 已知基础组件，直接使用，不递归
  2. 文件路径有值    → 已生成的业务组件，直接 import，不递归
  3. 未匹配          → 询问用户是否生成、保存在哪里，确认后递归拉取该 figma-node 生成子组件文件，完成后补充本表
-->

| Figma 组件名（模糊匹配） | 项目组件 | 文件路径 | 备注 |
|---|---|---|---|
<!-- 每次递归生成新组件后，在此补充一行，例如：
| ProductCard | `ProductCard` | src/components/ProductCard.tsx | 已生成 |
-->

---

## CSS 框架配置

<!-- 填写：使用的 CSS 框架（Tailwind / UnoCSS / CSS Modules 等） -->
**框架**：Tailwind CSS

<!-- 填写间距单位。标准 Tailwind 是 1unit=4px，如果项目自定义了请修改 -->
**间距单位**：1unit = 4px

<!-- 骨架换算示例（根据实际单位调整）：
  骨架 gap-2（=8px）→ Tailwind gap-2
  骨架 px-4（=16px）→ Tailwind px-4
  如果项目 1unit = 1px：
  骨架 gap-2（=8px）→ 项目写 gap-8
-->

---

## 设计 Token

### 文字样式

<!-- 填写项目的文字 token，骨架会输出原始 CSS，转换为项目 token -->

| 骨架输出 | 项目 className |
|---|---|
| `text-[18px] font-medium` | `text-lg font-medium` |
| `text-base font-medium` / `text-[16px] font-medium` | `text-base font-medium` |
| `text-base font-normal` / `text-[16px]` | `text-base` |
| `text-sm font-normal` / `text-[14px]` | `text-sm` |
| `text-[12px]` | `text-xs` |

### 颜色 Token

<!-- 填写颜色 token 映射，骨架会输出原始值 -->

| 骨架输出 | 项目 className |
|---|---|
| `text-[rgba(0,0,0,0.64)]` | `text-gray-600` |
| `text-[rgba(0,0,0,0.4)]` / `text-[#999]` | `text-gray-400` |
| `bg-[#F7F7F9]` / `bg-[#f5f5f5]` | `bg-gray-100` |
| `text-black` / `text-[#000]` | `text-gray-900` |
