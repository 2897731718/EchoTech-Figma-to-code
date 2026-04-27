# 输入框

## DuInput

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Input` / `InputFrame` / `TextField` | `<DuInput>` | 见下方 |
| `FormItem` 且变体为 `Type=Input_frame`（无 label） | `<DuInput>` | 直接用，不套 Form |
| `FormItem` 且有 label 文字 | `<FormItem>` + `<DuInput>` | 套 Form |

```html
<!-- 外边框样式（bordered），适合独立输入框场景 -->
<DuInput v-model:value="form.name" placeholder="请输入" bordered />

<!-- 隐藏底部分割线（withoutBorder），适合自定义布局 -->
<DuInput v-model:value="form.name" placeholder="请输入" withoutBorder />

<!-- 默认样式（有底部分割线，不加 bordered / withoutBorder） -->
<DuInput v-model:value="form.name" placeholder="请输入" />

<!-- 带前缀文本 -->
<DuInput v-model:value="form.phone" placeholder="请输入手机号" prefix="+86" />

<!-- 带后缀文本 -->
<DuInput v-model:value="form.amount" placeholder="请输入金额" suffix="元" />

<!-- 带右侧图标 + 清除按钮 -->
<DuInput v-model:value="form.search" placeholder="搜索" rightIcon="search" allowClear />

<!-- 密码输入 -->
<DuInput v-model:value="form.password" type="password" placeholder="请输入密码" />
```

**DuInput props**：
- `v-model:value`
- `type`：`'text'` | `'number'` | `'idcard'` | `'digit'` | `'password'`
- `placeholder`
- `bordered`：boolean，外边框样式（适合独立输入框）
- `withoutBorder`：boolean，隐藏底部分割线
- `disabled`
- `maxlength`
- `inputAlign`：文字对齐
- `allowClear`：boolean，显示清除按钮
- `rightIcon`：右侧图标名
- `prefix`：前缀文本
- `suffix`：后缀文本
- `extClass`

---

## DuTextarea

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Textarea` | `<DuTextarea>` | 见下方 |

```html
<!-- 多行文本 -->
<DuTextarea v-model:value="form.desc" placeholder="请输入" :maxlength="200" showCount />

<!-- 多行文本，带外边框 -->
<DuTextarea v-model:value="form.desc" placeholder="请输入" bordered :maxlength="-1" />
```

**DuTextarea props**：
- `v-model:value`
- `placeholder`
- `bordered`：boolean
- `showCount`：boolean
- `maxlength`：number（-1 为无限制）

---

## DuInputNumber

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `InputNumber` / `Stepper` / `Counter` | `<DuInputNumber>` | 见下方 |

```html
<!-- 基础数字输入 -->
<DuInputNumber v-model:value="count" :min="1" :max="99" />

<!-- 带步长 -->
<DuInputNumber v-model:value="count" :step="10" :min="0" :max="100" />

<!-- 允许手动输入 -->
<DuInputNumber v-model:value="count" :input="true" />

<!-- 不同尺寸 -->
<DuInputNumber v-model:value="count" size="small" />
<DuInputNumber v-model:value="count" size="large" />
```

**DuInputNumber props**：
- `v-model:value`：number
- `min`：number，最小值
- `max`：number，最大值
- `step`：number，步长（默认 1）
- `input`：boolean，是否允许手动输入
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`
- `color`：色板颜色名
- `disabled`：boolean
