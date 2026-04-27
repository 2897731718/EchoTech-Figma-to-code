# 项目 Figma 规范

> 此文件由 `figma-to-code init --ui=your-ui-lib` 生成。
> 组件库规则在 `.claude/figma-base/` 目录，可通过 `figma-to-code update` 更新。

---

## 业务组件映射

<!--
骨架中未识别的 INSTANCE 节点会附带 <!-- figma-node: xxx --> 注释。
翻译时按本表决策，三种情况：
  1. 文件路径为 "-"  → 已知基础组件，直接使用，不递归
  2. 文件路径有值    → 已生成的业务组件，直接 import，不递归
  3. 未匹配          → 询问用户是否生成、保存在哪里，确认后递归拉取该 figma-node 生成子组件文件，完成后补充本表
-->

| Figma 组件名（模糊匹配） | 项目组件 | 文件路径 | 备注 |
|---|---|---|---|
<!-- 每次递归生成新组件后，在此补充一行，例如：
| ProductCard | `ProductCard` | src/components/ProductCard.vue | 已生成 |
-->

---

## UnoCSS 配置

<!--
⚠ 根据实际项目配置修改此部分
your-ui-lib 使用 unocss-preset-echo，间距单位需确认
-->

**间距单位**：1unit = 1px（请根据 uno.config.ts 确认）

换算示例（1unit = 1px 时）：
- 骨架 `gap-2`（标准 8px）→ 项目写 `gap-8`
- 骨架 `px-3.75`（15px）→ 项目写 `px-15`
- 骨架 `py-4`（16px）→ 项目写 `py-16`

---

## 设计 Token

<!--
⚠ 以下为参考值，根据实际项目的 uno.config.ts / theme.css 填写
-->

### 文字样式

| 骨架输出 | 项目 class |
|---|---|
| `text-[18px] font-medium` | `text-h3 fw-500` |
| `text-base font-medium` / `text-[16px] font-medium` | `text-h4 fw-500` |
| `text-base font-normal` / `text-[16px]` | `text-b4` |
| `text-sm font-normal` / `text-[14px]` | `text-b5` |
| `text-[12px]` | `text-b6` |

### 颜色 Token

| 骨架输出 | 项目 class |
|---|---|
| `text-[rgba(0,0,0,0.88)]` / `text-black` | `c-text-1` |
| `text-[rgba(0,0,0,0.64)]` | `c-text-2` |
| `text-[rgba(0,0,0,0.4)]` / `text-[#999]` | `c-text-3` |
| `bg-[#F7F7F9]` / `bg-[#f5f5f5]` | `bg-page` |

---

## 组件引入

your-ui-lib 组件需手动 import：`import { Button, Icon, ... } from 'your-ui-lib'`
