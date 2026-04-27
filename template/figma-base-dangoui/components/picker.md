# 选择器（高级）

## DuPicker

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Picker` / `Select` | `<DuPicker>` | 见下方 |

```html
<!-- 基本用法 -->
<DuPicker
  v-model:value="pickerValue"
  :columns="[
    [
      { label: '北京', value: 'beijing' },
      { label: '上海', value: 'shanghai' },
    ]
  ]"
  title="选择城市"
/>

<!-- 多列 -->
<DuPicker
  v-model:value="dateValue"
  :columns="[yearColumns, monthColumns, dayColumns]"
  title="选择日期"
/>

<!-- 在 FormItem 中使用（自动适配表单样式） -->
<FormItem label="城市">
  <DuPicker v-model:value="city" :columns="cityColumns" title="选择城市" />
</FormItem>

<!-- 自定义触发器 -->
<DuPicker v-model:value="val" :columns="columns" v-slot="{ open }">
  <Button @click="open">打开选择器</Button>
</DuPicker>
```

**DuPicker props**：
- `value`：`string[]`，v-model 双向绑定，每列一个值
- `columns`：`{ label: string; value: string }[][]`，选项列数据
- `title`：string，标题，默认 `'请选择'`
- `open`：boolean，控制显隐

**事件**：`@update:value` / `@update:open`

---

## DuPickerView

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `PickerView` | `<DuPickerView>` | 见下方 |

```html
<!-- 内联滚动选择（不带弹窗） -->
<DuPickerView
  v-model:value="pickerValue"
  :columns="[
    [
      { label: '00 时', value: '0' },
      { label: '01 时', value: '1' },
    ],
    [
      { label: '00 分', value: '0' },
      { label: '30 分', value: '30' },
    ],
  ]"
/>
```

**DuPickerView props**：
- `value`：`string[]`，v-model 双向绑定
- `columns`：`{ label: string; value: string }[][]`

---

## DuCascader

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Cascader` | `<DuCascader>` | 见下方 |

```html
<!-- 基本用法 -->
<DuCascader
  v-model:value="region"
  :options="regionOptions"
  title="选择地区"
/>

<!-- 带搜索 -->
<DuCascader
  v-model:value="region"
  :options="regionOptions"
  title="选择地区"
  show-search
  search-placeholder="搜索地区"
/>

<!-- 在 FormItem 中使用 -->
<FormItem label="地区">
  <DuCascader v-model:value="region" :options="regionOptions" title="选择地区" />
</FormItem>
```

**DuCascader props**：
- `value`：`string[]`，v-model 双向绑定，每级选中值
- `options`：`{ label: string; value: string; children?: CascaderOption[] }[]`
- `title`：string，默认 `'请选择'`
- `open`：boolean，控制显隐
- `showSearch`：boolean，是否显示搜索
- `searchPlaceholder`：string
- `popupStyle`：自定义弹窗样式

**事件**：`@update:value` / `@update:open` / `@confirm(options[])`
**插槽**：`default`（自定义触发器，`v-slot="{ open }"`）/ `option`（自定义选项渲染）

---

## DuCalendar

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Calendar` | `<DuCalendar>` | 见下方 |

```html
<!-- 单选日期 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="single"
  @confirm="handleDateConfirm"
/>

<!-- 多选日期 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="multiple"
  :selectable-count="7"
  @confirm="handleDatesConfirm"
/>

<!-- 范围选择 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="range"
  :selectable-count="30"
  @confirm="handleRangeConfirm"
/>

<!-- 带时间选择 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="range"
  show-time-picker
  :time-step="5"
  @confirm="handleConfirm"
/>
```

**DuCalendar props**：
- `visible`：boolean，v-model 双向绑定
- `type`：`'single'` | `'multiple'` | `'range'`，默认 `'multiple'`
- `title`：string
- `confirmText`：string，确认按钮文案
- `selectedDate`：`dayjs.Dayjs | dayjs.Dayjs[]`，初始选中日期
- `min` / `max`：`dayjs.Dayjs | number`，可选范围
- `selectableCount`：number，最大可选天数，默认 `30`
- `weekStart`：number，周起始日（0=周日），默认 `0`
- `showTimePicker`：boolean，是否显示时间选择
- `timeStep`：`1` | `5` | `10`，时间步长，默认 `5`

**事件**：`@confirm({ value, date, dates })` / `@close` / `@clear`
