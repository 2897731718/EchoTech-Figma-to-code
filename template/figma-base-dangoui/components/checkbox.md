# 选择框

## DuCheckbox

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Checkbox` | `<DuCheckboxGroup>` + `<DuCheckbox>` | 见下方 |

```html
<!-- 基本用法：配合 CheckboxGroup -->
<DuCheckboxGroup v-model:value="selected">
  <DuCheckbox value="a" label="选项 A" />
  <DuCheckbox value="b" label="选项 B" />
  <DuCheckbox value="c" label="选项 C" />
</DuCheckboxGroup>

<!-- 行内排列 -->
<DuCheckboxGroup v-model:value="selected" inline>
  <DuCheckbox value="a" label="选项 A" />
  <DuCheckbox value="b" label="选项 B" />
</DuCheckboxGroup>

<!-- 卡片样式 -->
<DuCheckboxGroup v-model:value="selected" shape="card">
  <DuCheckbox value="a" label="卡片选项 A" />
  <DuCheckbox value="b" label="卡片选项 B" />
</DuCheckboxGroup>

<!-- 独立使用 -->
<DuCheckbox v-model:checked="agreed" label="我已阅读并同意" />
```

**DuCheckboxGroup props**：
- `value`：`string[]`，v-model 双向绑定
- `shape`：`'round'` | `'square'` | `'card'`
- `inline`：boolean，行内排列
- `position`：`'left'` | `'right'`，图标位置
- `color`：色板颜色名
- `custom`：boolean，自定义渲染

**DuCheckbox props**：
- `value`：string，配合 Group 使用的值
- `checked`：boolean，独立使用时的选中状态
- `label`：string，文字标签
- `shape` / `inline` / `position` / `color`：覆盖 Group 配置
- `disabled`：boolean
- `custom`：boolean，自定义渲染（slot）

---

## DuRadio

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Radio` | `<DuRadioGroup>` + `<DuRadio>` | 见下方 |

```html
<!-- 基本用法 -->
<DuRadioGroup v-model:value="selected">
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>

<!-- 行内排列 -->
<DuRadioGroup v-model:value="selected" inline>
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>

<!-- 按钮样式 -->
<DuRadioGroup v-model:value="selected" shape="button" inline>
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>

<!-- Cell 模式（label 在左，图标在右） -->
<DuRadioGroup v-model:value="selected" cell>
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>
```

**DuRadioGroup props**：
- `value`：any，v-model 双向绑定
- `shape`：`'normal'` | `'button'`
- `inline`：boolean，行内排列
- `cell`：boolean，左右分布模式
- `custom`：boolean，自定义渲染
- `valueKey`：string，对象值比较 key
- `color`：色板颜色名

**DuRadio props**：
- `value`：any，当前项的值
- `checked`：boolean，独立使用
- `label`：string，文字标签
- `shape` / `inline` / `cell` / `color`：覆盖 Group 配置
- `disabled`：boolean
- `disabledTip`：string，禁用时 toast 提示
- `custom`：boolean

---

## DuRadioIcon

单选按钮图标组件，用于自定义渲染单选按钮的选中状态图标。

```html
<!-- 自定义单选项布局时使用 -->
<DuRadioGroup v-model:value="selected" custom>
  <div v-for="item in options" :key="item.value" @click="selected = item.value">
    <DuRadioIcon :checked="selected === item.value" color="primary" />
    <span>{{ item.label }}</span>
  </div>
</DuRadioGroup>
```

**DuRadioIcon props**：
- `checked`：boolean，选中状态
- `disabled`：boolean
- `size`：string | number，图标尺寸
- `color`：色板颜色名
