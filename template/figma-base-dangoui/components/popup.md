# 弹窗

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Popup` / `Sheet` / `BottomSheet` | `<DuPopup>` | 见下方 |

```html
<!-- 底部弹出，带标题栏和关闭按钮 -->
<DuPopup
  v-model:visible="popupVisible"
  title="选择选项"
  type="bottom"
  headerVisible
  closable
  maskClick
  safeArea
>
  <!-- 内容 -->
</DuPopup>

<!-- 居中弹出，标题居中 -->
<DuPopup
  v-model:visible="centerPopupVisible"
  title="提示"
  type="center"
  titleAlign="center"
  headerVisible
  closable
>
  <!-- 内容 -->
</DuPopup>

<!-- 顶部弹出，不显示内置头部（自定义头部） -->
<DuPopup
  v-model:visible="topPopupVisible"
  type="top"
  :headerVisible="false"
  :maskClick="false"
>
  <!-- 自定义头部 + 内容 -->
</DuPopup>
```

**DuPopup props**：
- `v-model:visible`
- `title`
- `titleAlign`：`'center'` | `'default'`（default 左对齐）
- `headerVisible`：boolean，显示内置头部栏
- `type`：`'center'` | `'top'` | `'bottom'`
- `maskClick`：boolean，点击遮罩关闭
- `closable`：boolean，显示关闭按钮（需同时开启 `headerVisible`）
- `safeArea`：boolean，自带 safe area
- `extClass`
