# 基础组件

## Icon

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Icon` / `Arrow` / `Chevron` / `Close` / `Search` | `<Icon>` | `<Icon name="arrow-right" size={16} />` |

- `name`：从节点名推断（如 `IconArrowRight` → `arrow-right`，转为 kebab-case）
- `size`：从骨架的 `w-[Npx]` 读取数字

```tsx
<Icon name="arrow-right" size={12} />
<Icon name="close" size={20} color="primary" />
<Icon name="search" size={20} className="custom-icon" />
```

---

## Button

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Button` / `Btn` / `Submit` | `<Button>` | 见下方 |

```tsx
{/* 主按钮，全宽 */}
<Button variant="primary" size="large" block onClick={handleSubmit}>提交</Button>

{/* 描边按钮 */}
<Button variant="outline" onClick={handleCancel}>取消</Button>

{/* 文字按钮 */}
<Button variant="text" onClick={handleView}>查看详情</Button>

{/* 带图标 */}
<Button variant="primary" icon={<Icon name="arrow-right" />} iconPosition="right" onClick={handleNext}>
  下一步
</Button>

{/* 加载中 */}
<Button variant="primary" loading={submitting} block onClick={handleSubmit}>提交</Button>
```

---

## Input

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Input` / `InputFrame` / `TextField` | `<Input>` | 见下方 |

```tsx
{/* 基础输入框 */}
<Input value={name} onChange={setName} placeholder="请输入" />

{/* 带边框样式 */}
<Input value={name} onChange={setName} placeholder="请输入" bordered />

{/* 带前缀/后缀 */}
<Input value={phone} onChange={setPhone} placeholder="请输入手机号" prefix="+86" />
<Input value={amount} onChange={setAmount} placeholder="请输入金额" suffix="元" />

{/* 密码输入 */}
<Input type="password" value={password} onChange={setPassword} placeholder="请输入密码" />
```

---

## Select

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Picker` / `DatePicker` / `Select` / `Dropdown` | `<Select>` | 见下方 |

```tsx
<Select
  value={year}
  onChange={setYear}
  open={yearPickerOpen}
  onOpenChange={setYearPickerOpen}
  options={YEAR_OPTIONS}
  placeholder="选择年份"
/>

{/* 多选 */}
<Select
  mode="multiple"
  value={tags}
  onChange={setTags}
  options={TAG_OPTIONS}
  placeholder="选择标签"
/>
```

---

## Divider

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Divider` / `Line` / `Separator` | `<Divider>` | `<Divider />` |

```tsx
<Divider />
<Divider type="vertical" />
<Divider className="my-16" />
```

---

## Tag

```tsx
<Tag color="primary">标签文字</Tag>
<Tag variant="outline" color="primary">描边标签</Tag>
<Tag closable onClose={handleClose}>可关闭</Tag>
```

---

## Switch

```tsx
<Switch checked={enabled} onChange={setEnabled} />
<Switch checked={notify} onChange={setNotify} disabled />
```
