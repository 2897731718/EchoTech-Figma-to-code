# 反馈组件

## Modal

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Modal` / `Dialog` / `Popup` | `<Modal>` | 见下方 |

```tsx
<Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title="确认操作"
>
  <p>确定要执行此操作吗？</p>
  <div className="flex gap-12 mt-16">
    <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
    <Button variant="primary" onClick={handleConfirm}>确认</Button>
  </div>
</Modal>
```
