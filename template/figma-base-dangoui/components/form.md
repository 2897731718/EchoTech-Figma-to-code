# 表单

**展示行 vs 输入框判断规则：**

> **只有单个输入框、或没有 label 的输入框，直接用 `DuInput`，禁止套 `Form`。**

连续多个「label + 输入框」行，且 label 宽度视觉一致时，才用 `Form` + `FormItem` 包裹。

## Form

**Form props**：
- `model`：表单数据对象（`:model`）
- `labelSize`：label 固定宽度 px 字符串，如 `"80"`
- `labelAlign`：`'left'` | `'right'`
- `layout`：`'horizontal'` | `'vertical'`
- **注意：Form 没有 `border` prop**，分割线通过 FormItem 的 `showBorder` 控制

## FormItem

**FormItem props**：
- `label`：左侧标签文字
- `labelSize`
- `labelAlign`
- `layout`：`'horizontal'` | `'vertical'`
- `showBorder`：boolean，显示底部边框分割线
- `required`：boolean
- `tips`：提示文本
- `justify`：`'end'` | `'start'`，内容水平对齐
- `items`：`'center'` | `'start'`，内容垂直对齐（horizontal 模式）
- `extClass`

## 示例

```html
<!-- 标准表单：showBorder 控制分割线，horizontal 布局 -->
<Form :model="form" labelSize="80" labelAlign="right" layout="horizontal">
  <FormItem label="银行卡号" showBorder>
    <DuInput v-model:value="form.bankCard" placeholder="请输入" />
  </FormItem>
  <FormItem label="开户银行" showBorder>
    <DuSelect
      v-model:value="form.bank"
      v-model:open="bankOpen"
      :options="BANK_OPTIONS"
      title="请选择银行"
      formItem
    />
  </FormItem>
  <FormItem label="手机号">
    <DuInput v-model:value="form.phone" placeholder="请输入手机号" type="number" />
  </FormItem>
</Form>

<!-- 垂直布局表单 -->
<Form :model="form" layout="vertical">
  <FormItem label="备注" layout="vertical" required tips="最多200字">
    <DuTextarea v-model:value="form.remark" placeholder="请输入" :maxlength="200" showCount />
  </FormItem>
</Form>
```

---

## FormField

表单字段展示组件，用于显示只读的表单值，点击可触发选择器或跳转。

```html
<!-- 在 FormItem 中使用 -->
<FormItem label="城市">
  <FormField :text="selectedCity" placeholder="请选择" @click="openCityPicker" />
</FormItem>
```

**FormField props**：
- `text`：显示的文本值
- `placeholder`：占位文本
- `arrowRight`：自定义右侧箭头图标
