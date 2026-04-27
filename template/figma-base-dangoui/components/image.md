# 图片与头像

## Image

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| 骨架中 `backgroundColor: 'url(figma-image:unknown)'` | `<Image>` | 见下方 |

```html
<Image src="imageUrl" width="100px" height="100px" radius="8px" mode="aspectFill" />
<Image src="coverUrl" width="100%" height="200px" mode="widthFix" />
```

**Image props**：
- `src`：图片地址
- `mode`：`'aspectFit'` | `'aspectFill'` | `'widthFix'`
- `width`：number | string（默认 `'100%'`），推荐使用带单位字符串如 `"80px"` 或 `"100%"`
- `height`：number | string（默认 `'100%'`），推荐使用带单位字符串如 `"80px"` 或 `"100%"`
- `radius`：number | string，圆角，推荐使用带单位字符串如 `"8px"`
- `showMenuByLongPress`：boolean
- `extClass` / `extStyle`

**图片占位翻译规则**：骨架中 `:style="{ backgroundColor: 'url(figma-image:unknown)' }"` → 替换为 `<Image :src="变量名" />`，尺寸从骨架 class 中读取

---

## Avatar

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Avatar` | `<Avatar>` | 见下方 |

```html
<Avatar src="https://..." size="normal" />
<Avatar src="https://..." size="small" type="primary" bordered />
```

**Avatar props**：
- `src`：图片地址
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`
- `type`：`'primary'` | `'trade'` | `'success'` | `'error'` | `'default'` | `'white'`
- `bordered`：boolean，显示边框
- `icon`：无图片时显示的图标
- `iconColor`
- `extClass` / `extStyle`

---

## AvatarGroup

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `AvatarGroup` | `<AvatarGroup>` | 见下方 |

```html
<AvatarGroup :avatars="avatarUrls" size="mini" :limit="5" reverse />
```

**AvatarGroup props**：
- `avatars`：`string[]`，头像 URL 数组
- `size` / `type` / `bordered`：同 Avatar
- `limit`：最大显示数量（0 为不限制）
- `reverse`：boolean，反向堆叠
- `gap`：number，堆叠间距
