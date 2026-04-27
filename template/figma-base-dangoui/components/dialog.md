# 对话框

## DuDialog

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Dialog` / `Confirm` / `Alert` | `<DuDialog>` | 见下方 |

```html
<!-- 基本用法：v-model 控制显隐 -->
<DuDialog v-model:visible="showDialog" title="确认操作">
  <p>确定要删除该内容吗？</p>
</DuDialog>

<!-- 自定义按钮文案 -->
<DuDialog
  v-model:visible="showDialog"
  title="提示"
  ok-text="确认"
  cancel-text="返回"
  @confirm="handleConfirm"
  @cancel="handleCancel"
>
  <p>操作不可撤销，是否继续？</p>
</DuDialog>

<!-- 垂直按钮排列 -->
<DuDialog v-model:visible="showDialog" title="选择" action-layout="vertical">
  <p>内容</p>
</DuDialog>

<!-- ref 命令式调用 -->
<DuDialog ref="dialogRef" title="提示">内容</DuDialog>
<!-- dialogRef.value.open({ title: '动态标题' }) -->
```

**DuDialog props**：
- `visible`：boolean，v-model 双向绑定
- `title`：弹窗标题
- `headerVisible`：boolean，是否展示头部栏，默认 `true`
- `closable`：boolean，是否展示关闭按钮，默认 `false`
- `actionLayout`：`'horizontal'` | `'vertical'`，按钮排列方式，默认 `'horizontal'`
- `okText`：确认按钮文字，默认 `'确定'`
- `cancelText`：取消按钮文字，默认 `'取消'`
- `extClass` / `extStyle` / `maskClass` / `maskStyle`

**事件**：`@confirm` / `@cancel` / `@close`
**方法**（ref）：`open(options)` / `close()`

---

## DuActionSheet

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `ActionSheet` | `<DuActionSheet>` | 见下方 |

```html
<!-- 列表模式 -->
<DuActionSheet
  v-model:open="showSheet"
  type="list"
  :items="[
    { label: '拍照', key: 'camera' },
    { label: '从相册选择', key: 'album' },
  ]"
  @select="handleSelect"
/>

<!-- 宫格模式（分享面板） -->
<DuActionSheet
  v-model:open="showShare"
  type="grid"
  :items="[
    { label: '微信', icon: 'wechat-colorful', key: 'wechat' },
    { label: '复制链接', icon: 'link', key: 'copy' },
  ]"
  @select="handleSelect"
/>
```

**DuActionSheet props**：
- `open`：boolean，v-model 双向绑定
- `type`：`'list'` | `'grid'`，列表或宫格，默认 `'list'`
- `items`：`{ key?: string; label: string; icon?: string; openType?: string }[]`

**事件**：`@select(item)` / `@update:open`
