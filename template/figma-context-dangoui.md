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
⚠ 根据实际项目 uno.config.ts 配置修改此部分
-->

**间距单位**：保留 px 后缀（presetUno 默认配置）

写法示例：
- 骨架 `gap-[8px]` → 项目写 `gap-8px` 或保留 `gap-[8px]`
- 骨架 `px-[15px]` → 项目写 `px-15px` 或保留 `px-[15px]`
- 骨架 `w-[100px]` → 项目写 `w-100px` 或保留 `w-[100px]`
- 骨架 `rounded-[8px]` → 项目写 `rounded-8px`

<!--
如果项目使用 unocss-preset-echo（1unit = 1px），则可去掉 px：
- 骨架 `gap-[8px]` → 项目写 `gap-8`
-->

---

## 设计 Token

### 颜色 Token

骨架已输出 `var(--token-name, #fallback)` 格式，可直接使用。

- 项目有 `design-tokens.css` → 自动使用 `var(--token-name)`
- 项目没有对应变量 → 自动 fallback 到原始颜色值

**无需手动维护颜色映射表。**

### 文字样式

<!--
⚠ 以下为参考值，根据实际项目的 uno.config.ts 填写
骨架输出原始 CSS 值，翻译时按此表转换为项目 shortcuts
-->

| 骨架输出 | 项目 class |
|---|---|
| `text-[24px] font-[500] leading-[30px]` | `text-h1` |
| `text-[20px] font-[500] leading-[26px]` | `text-h2` |
| `text-[18px] font-[500] leading-[25px]` | `text-h3` |
| `text-[16px] font-[500] leading-[24px]` | `text-h4` |
| `text-[14px] font-[500] leading-[22px]` | `text-h5` |
| `text-[12px] font-[500] leading-[18px]` | `text-h6` |
| `text-[16px] font-[400] leading-[24px]` | `text-b4` |
| `text-[14px] font-[400] leading-[22px]` | `text-b5` |
| `text-[12px] font-[400] leading-[18px]` | `text-b6` |
| `text-[10px] font-[400] leading-[11px]` | `text-b8` |

---

## 组件引入

your-ui-lib 组件需手动 import：`import { Button, Icon, ... } from 'your-ui-lib'`
