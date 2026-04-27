# 选择器

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Picker` / `DatePicker` / `Select` / `Dropdown` | `<DuSelect>` | 见下方 |

```html
<!-- 基础选择器 -->
<DuSelect
  v-model:value="form.year"
  v-model:open="yearPickerOpen"
  :options="YEAR_OPTIONS"
  title="选择年份"
/>

<!-- 多选 + 可搜索 -->
<DuSelect
  v-model:value="form.tags"
  v-model:open="tagsOpen"
  :options="TAG_OPTIONS"
  title="选择标签"
  mode="multiple"
  filterable
  withConfirm
/>

<!-- 在 FormItem 中使用，自动显示表单项样式 -->
<DuSelect
  v-model:value="form.bank"
  v-model:open="bankOpen"
  :options="BANK_OPTIONS"
  title="选择银行"
  formItem
/>
```

**DuSelect props**：
- `v-model:value`
- `v-model:open`
- `options`：`SelectOption[]`（`{ label, value, disabled? }`）
- `title`：placeholder 兼弹出层标题
- `mode`：`'multiple'`，多选
- `filterable`：boolean，可搜索
- `withConfirm`：boolean，带确认按钮
- `formItem`：boolean，在 FormItem 中时自动显示表单项样式
