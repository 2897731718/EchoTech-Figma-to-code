# 表单组件

## Textarea

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Textarea` | `<Textarea>` | 见下方 |

```tsx
<Textarea value={desc} onChange={setDesc} placeholder="请输入" maxLength={200} showCount />
```

---

## Form + FormItem

**展示行 vs 输入框判断规则：**

> **只有单个输入框、或没有 label 的输入框，直接用 `Input`，禁止套 `Form`。**

连续多个「label + 输入框」行，且 label 宽度视觉一致时，才用 `Form` + `FormItem` 包裹。

```tsx
{/* 标准表单 */}
<Form>
  <FormItem label="银行卡号">
    <Input value={form.bankCard} onChange={v => setForm({ ...form, bankCard: v })} placeholder="请输入" />
  </FormItem>
  <FormItem label="开户银行">
    <Select
      value={form.bank}
      onChange={v => setForm({ ...form, bank: v })}
      options={BANK_OPTIONS}
      placeholder="请选择银行"
    />
  </FormItem>
</Form>
```
