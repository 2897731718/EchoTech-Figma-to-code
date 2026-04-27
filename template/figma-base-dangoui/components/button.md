# 按钮

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Button` / `Btn` / `Submit` | `<Button>` | 见下方 |

```html
<!-- 主按钮，全宽 -->
<Button color="primary" type="primary" size="large" full @click="handleSubmit">提交</Button>

<!-- 描边按钮 -->
<Button type="outline" color="primary" @click="fn">取消</Button>

<!-- 文字按钮 -->
<Button type="text" color="primary" @click="fn">查看详情</Button>

<!-- 带图标 -->
<Button color="primary" icon="arrow-right" iconPosition="right" @click="fn">下一步</Button>

<!-- 加载中 -->
<Button color="primary" :loading="submitting" full @click="handleSubmit">提交</Button>
```

**Button props**：
- `color`：色板颜色名（primary / danger / warning 等）
- `type`：`'text'` | `'primary'` | `'secondary'` | `'outline'`
- `size`：`'small'` | `'mini'` | `'normal'` | `'medium'` | `'large'`
- `full`：boolean，全宽
- `loading`：boolean
- `disabled`：boolean
- `icon`：图标名
- `iconPosition`：`'left'` | `'right'`
- `arrowRight`：boolean
- `extClass`：自定义 class
