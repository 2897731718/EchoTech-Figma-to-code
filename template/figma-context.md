# 项目 Figma 规范

> 复制此文件到项目 `.claude/figma-context.md`，按注释填写项目信息。
> `/figma` skill 生成代码时会读取此文件。

---

## 组件库

<!-- 填写：组件前缀、包名 -->
**前缀**：`Du*`
**包名**：`@duxui/vue`

### 组件引入

<!-- 填写：按需引入 or 全局注册 -->

```ts
// 按需引入示例（根据实际包名修改）
import { Button, DuInput } from '@duxui/vue'
```

### 常用组件映射

<!--
格式：Figma 节点名关键词 | 组件标签 | 典型用法
关键词大小写不敏感，支持部分匹配
-->

| Figma 节点名含 | 使用组件 | 典型用法 |
|---|---|---|
| `Icon` / `Arrow` | `<Icon>` | `<Icon name="arrow-right" :size="12" />` |
| `Divider` | `<DuDivider>` | `<DuDivider class="my-16" />` |
| `Input` / `FormItem` | `<DuInput>` | `<DuInput v-model:value="val" placeholder="请输入" bordered />` |
| `Button` | `<Button>` | `<Button color="primary" size="large" @click="fn">提交</Button>` |
| `Picker` | `<DuPicker>` | `<DuPicker v-model:open="open" :columns="cols" @update:value="fn" />` |

<!-- 继续添加项目中其他常用组件 -->

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
| icon/* / Icon* | `Icon` | - | 基础组件 |
| Button* / *button* | `Button` | - | 基础组件 |
| Input* / FormItem* | `DuInput` | - | 基础组件 |
| Divider* | `DuDivider` | - | 基础组件 |

<!-- 每次递归生成新组件后，在此补充一行，例如：
| ProductCard | `ProductCard` | src/components/ProductCard.vue | 已生成 |
-->

---

## UnoCSS 配置

<!-- 填写间距单位。标准 Tailwind 是 1unit=4px，如果项目自定义了请修改 -->
**间距单位**：1unit = 1px

<!-- 骨架换算示例（根据实际单位调整）：
  骨架 gap-2（=8px）→ 项目写 gap-8
  骨架 px-3.75（=15px）→ 项目写 px-15
  骨架 py-4（=16px）→ 项目写 py-16
-->

---

## 设计 Token

### 文字样式

<!-- 填写项目的文字 token，骨架会输出原始 CSS（如 text-base font-medium），转换为项目 token -->

| 骨架输出 | 项目 token |
|---|---|
| `text-base font-medium` / `text-[16px] font-medium` | `text-h4 fw-500` |
| `text-base font-normal` / `text-[16px] font-normal` | `text-b4` |
| `text-sm font-normal` / `text-[14px] font-normal` | `text-b5` |

<!-- 继续添加 -->

### 颜色 Token

<!-- 填写颜色 token 映射，骨架会输出原始值 -->

| 骨架输出 | 项目 token |
|---|---|
| `text-[rgba(0,0,0,0.64)]` | `c-text-2` |
| `text-[#999]` / `text-[rgba(0,0,0,0.4)]` | `text-hex-999` |
| `bg-[#F7F7F9]` | `bg-hex-F7F7F9` |

<!-- 继续添加 -->

---

## 页面结构模板

<!-- 填写项目标准的页面根结构，生成时作为外层包裹 -->

```html
<div class="flex flex-col min-h-screen bg-hex-F7F7F9">
  <!-- 内容卡片 -->
  <div class="bg-white px-15 py-16 mt-8">
    ...
  </div>

  <div class="flex-1" />

  <!-- 底部按钮区 -->
  <div class="px-15 py-4 safe-area-bottom b-hex-E5E5E5 b-t-1 b-t-solid">
    <Button class="w-full" color="primary" size="large" @click="handleSubmit">
      提交
    </Button>
  </div>
</div>
```

---

## 注意事项

<!-- 填写需要 AI 特别注意的项目约定 -->

- 宽度统一用 `w-full`，不写死像素值
- 图标尺寸从骨架的 `w-[Npx]` 读取，转为 `:size="N"`
- 列表数据、Picker 选项等动态数据加 `TODO: 接口` 注释
