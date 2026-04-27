# 图标

## Icon

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Icon` / `Arrow` / `Chevron` / `Close` / `Search` | `<Icon>` | `<Icon name="arrow-right" size="16px" />` |

- `name`：从节点名推断（如 `IconArrowRight` → `arrow-right`，转为 kebab-case）
- `size`：从骨架的 `w-[Npx]` 读取数字
- `color`：若骨架有颜色，转为 your-ui-lib 色板名或直接用 hex

```html
<Icon name="arrow-right" size="12px" />
<!-- color 可用色板名或 CSS 颜色值 -->
<Icon name="close" size="20px" color="primary" />
<Icon name="search" size="20px" extClass="custom-icon" />
```

**Icon props**：
- `name`：图标名（iconfont 名或图片链接）
- `size`：string | number，推荐使用带单位字符串如 `"20px"`
- `color`：色板颜色名或 CSS 颜色值
- `extClass`：自定义 class

---

## IconButton

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| 位于导航栏/工具栏首尾的单独 Icon INSTANCE | `<IconButton>` | 见下方 |

```html
<IconButton name="share" @click="handleShare" />
<IconButton name="more" size="large" color="primary" @click="handleMore" />
<IconButton name="close" text="关闭" @click="handleClose" />
<IconButton name="setting" disabled />
```

**IconButton props**：
- `name`：图标名（kebab-case）
- `icon`：图标对象（优先级高于 name）
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`
- `iconSize`：string，自定义图标大小
- `color`：色板颜色名
- `text`：图标下方文字
- `textColor`：文字颜色
- `disabled`：boolean
- `extClass` / `extStyle`

**模式识别**：骨架中可点击位置的单独 Icon（导航栏左右、列表行尾箭头）→ `IconButton`
