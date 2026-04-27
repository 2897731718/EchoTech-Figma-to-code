# 反馈提示

## DuToast

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Toast` | `<DuToastProvider>` + `useToast()` | 见下方 |

Toast 通过 Provider + inject 模式使用，不在模板中直接渲染：

```html
<!-- 在 App.vue 或页面根节点包裹 Provider -->
<DuToastProvider>
  <router-view />
</DuToastProvider>
```

```ts
// 在子组件中通过 inject 调用
import { inject } from 'vue'
import { toastInjectionKey } from 'your-ui-lib'

const toast = inject(toastInjectionKey)!
toast.show({ message: '操作成功' })
toast.show({ message: '加载中...', mask: true })
```

**ToastMessage**：
- `message`：string，提示文案
- `mask`：boolean，是否显示遮罩防止操作

---

## DuSnackbar

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Snackbar` | `<DuSnackbar>` | 见下方 |

```html
<!-- 基本用法 -->
<DuSnackbar :show="showSnackbar" @close="showSnackbar = false">
  操作成功
</DuSnackbar>

<!-- 带操作按钮 -->
<DuSnackbar
  :show="showSnackbar"
  :show-close="true"
  :show-action-btn="true"
  :button-props="{ text: '撤销', type: 'primary', color: 'white' }"
  @action="handleUndo"
  @close="showSnackbar = false"
>
  已删除 1 条记录
</DuSnackbar>

<!-- 带左侧图标 -->
<DuSnackbar :show="showSnackbar" left-icon="check-circle">
  保存成功
</DuSnackbar>

<!-- 固定位置（底部偏移） -->
<DuSnackbar :show="showSnackbar" :offset="50" offset-position="bottom">
  提示信息
</DuSnackbar>
```

**DuSnackbar props**：
- `show`：boolean，是否显示
- `showClose`：boolean，是否显示关闭按钮，默认 `false`
- `showActionBtn`：boolean，是否显示操作按钮，默认 `true`
- `buttonProps`：`{ text, color, type, size, arrowRight, extClass, extStyle }`
- `leftIcon`：左侧图标名
- `leftImage`：左侧图片 URL
- `offset`：偏移量（像素），默认 `0`
- `offsetPosition`：`'top'` | `'bottom'`，默认 `'bottom'`
- `duration`：自动关闭时间（秒），`0` 不自动关闭

**事件**：`@close` / `@action`

---

## DuNoticeBar

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `NoticeBar` / `Notice` | `<DuNoticeBar>` | 见下方 |

```html
<!-- 基础通知 -->
<DuNoticeBar text="系统维护通知，请注意保存数据" />

<!-- 带链接 -->
<DuNoticeBar
  text="新版本已发布"
  link-text="立即更新"
  @link-click="handleUpdate"
/>

<!-- 可关闭 -->
<DuNoticeBar text="活动已开始" :closeable="true" @close="handleClose" />

<!-- 主色样式 -->
<DuNoticeBar type="primary" color="danger" text="警告信息" />

<!-- 垂直布局（文案和链接上下排列） -->
<DuNoticeBar
  layout="vertical"
  text="重要通知"
  link-text="查看详情"
  :closeable="true"
/>
```

**DuNoticeBar props**：
- `type`：`'primary'` | `'secondary'`，默认 `'secondary'`
- `color`：色板颜色名，默认 `'primary'`
- `text`：通知文案
- `linkText`：链接文案
- `linkIcon`：链接图标
- `closeable`：boolean，是否可关闭，默认 `false`
- `layout`：`'horizontal'` | `'vertical'`，默认 `'horizontal'`
- `ellipsis`：boolean，超长截断，默认 `false`
- `icon`：左侧图标

**事件**：`@close` / `@link-click`
