# 项目 Figma 规范

> 此文件由 `/figma-init` 自动生成，可手动补充修改。
> `/figma` skill 在生成代码时会读取此文件。

---

## 组件库

**库名**：（示例：@duxui/vue）
**前缀**：Du*

### 常用组件

| Figma 节点名关键词 | 映射组件 | 基本用法 |
|---|---|---|
| `Icon` / `arrow` / `chevron` | `<Icon>` | `<Icon name="arrow-right" :size="12" />` |
| `Divider` / `divider` | `<DuDivider>` | `<DuDivider class="my-16" />` |
| `Input` / `input` / `FormItem` | `<DuInput>` | `<DuInput v-model:value="val" placeholder="请输入" bordered />` |
| `Button` / `button` | `<Button>` | `<Button color="primary" size="large" @click="fn">提交</Button>` |
| `Picker` / `picker` | `<DuPicker>` | `<DuPicker v-model:open="open" :columns="cols" @update:value="fn" />` |
| `Checkbox` | `<DuCheckbox>` | `<DuCheckbox v-model:value="val" />` |

---

## UnoCSS 配置

**间距单位**：1unit = 1px（非标准 Tailwind，`px-15` = 15px，`gap-8` = 8px）

换算规则：骨架中 `gap-2`（标准 = 8px）→ 项目中写 `gap-8`

---

## 设计 Token

### 文字样式
| Token | 含义 | 对应 CSS |
|---|---|---|
| `text-h4` | 页面小标题 | font-size: 16px, font-weight: 500 |
| `text-b4` | 正文 | font-size: 16px, font-weight: 400 |
| `text-b5` | 辅助小字 | font-size: 14px, font-weight: 400 |

骨架中 `text-base font-medium` → 项目中用 `text-h4 fw-500`

### 颜色 Token
| Token | 含义 | 对应值 |
|---|---|---|
| `c-text-2` | 次要文字色 | rgba(0,0,0,0.64) |
| `text-hex-999` | 提示文字色 | #999999 |
| `bg-hex-F7F7F9` | 页面背景色 | #F7F7F9 |

骨架中 `text-[rgba(0,0,0,0.64)]` → 项目中用 `c-text-2`

---

## 布局规范

- 页面根节点：`<div class="flex flex-col min-h-screen bg-hex-F7F7F9">`
- 内容卡片：`<div class="bg-white px-15 py-16 mt-8">`
- 容器宽度：不写死，统一用 `w-full`
- 底部安全区按钮栏：`<div class="px-15 py-4 safe-area-bottom b-hex-E5E5E5 b-t-1 b-t-solid">`

---

## 组件映射规则

骨架中 INSTANCE 节点名 → 项目组件的映射逻辑：

1. 包含 `Icon` / `Arrow` / `Chevron` → `<Icon name="从节点名推断" :size="从骨架尺寸读取" />`
2. 包含 `Input` / `FormItem` / `InputFrame` → `<DuInput>`，加 `v-model:value`、`placeholder`
3. 包含 `Button` → `<Button>`，加 `@click` 占位
4. 包含 `Divider` → `<DuDivider>`，去掉骨架中的宽高，只保留间距 class
5. 包含 `Picker` → `<DuPicker>`，加 `v-model:open`、`:columns`、`@update:value`

---

## 生成示例

**骨架输入：**
```html
<div class="flex flex-row gap-4 items-center">
  <span class="text-black text-base font-normal">年份</span>
  <div class="flex flex-row gap-1 items-center w-[55px]">
    <span class="text-[rgba(0,0,0,0.64)] text-base">2025</span>
    <IconArrowHeavyRight class="w-[12px] h-[12px]" />
  </div>
</div>
```

**期望输出：**
```html
<div class="flex items-center justify-between" @click="yearPickerOpen = true">
  <span class="text-b4">年份</span>
  <span class="text-b4 c-text-2 flex items-center gap-4">
    {{ yearLabel }}
    <Icon name="arrow-right" :size="12" />
  </span>
</div>
```
