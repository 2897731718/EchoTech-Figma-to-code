# 项目 Figma 规范

> 此文件由 `figma-to-code init` 生成。
> 组件库规则在 `.claude/figma-base/` 目录，可通过 `figma-to-code update` 更新。

---

## 组件库

<!-- ⚠ 必填：填写你项目使用的组件库信息 -->
**包名**：`your-ui-lib`
**前缀**：`Ui`（如 `<UiButton>`）

### 组件引入

<!-- 填写：按需引入 or 全局注册 -->

```ts
// 按需引入示例（根据实际包名修改）
import { UiButton, UiInput } from 'your-ui-lib'
```

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

## UnoCSS / Tailwind 配置

<!-- ⚠ 重要：根据项目实际配置选择单位写法 -->

**间距单位**：（请根据 uno.config.ts / tailwind.config.js 确认）

### 写法一：保留 px 后缀（presetUno 默认配置）
- 骨架 `gap-[8px]` → 项目写 `gap-8px` 或保留 `gap-[8px]`
- 骨架 `w-[100px]` → 项目写 `w-100px`

### 写法二：标准 Tailwind（1unit = 4px）
- 骨架 `gap-[8px]` → 项目写 `gap-2`（8 / 4 = 2）
- 骨架 `w-[100px]` → 项目写 `w-25`（100 / 4 = 25）

### 写法三：自定义 1unit = 1px
- 骨架 `gap-[8px]` → 项目写 `gap-8`
- 骨架 `w-[100px]` → 项目写 `w-100`

---

## 设计 Token

### 颜色 Token

骨架已输出 `var(--token-name, #fallback)` 格式，可直接使用。

- 项目有对应 CSS 变量 → 自动使用 `var(--token-name)`
- 项目没有对应变量 → 自动 fallback 到原始颜色值

**无需手动维护颜色映射表。**

### 文字样式

<!-- 填写项目的文字 token，骨架会输出原始 CSS，翻译时转换为项目 token -->

| 骨架输出 | 项目 token |
|---|---|
| `text-[16px] font-[500]` | `text-base font-medium` |
| `text-[14px] font-[400]` | `text-sm` |
| `text-[12px] font-[400]` | `text-xs` |

<!-- 继续添加 -->
