# 布局模式规则

## 横滑容器

骨架中 `overflow-x: auto` + 内部 `flex` 横向排列的结构，识别为横滑容器模式。

```tsx
{/* 骨架示例 */}
<div className="overflow-x-auto">
  <div className="flex gap-3">
    <div className="w-[120px] shrink-0">卡片1</div>
    <div className="w-[120px] shrink-0">卡片2</div>
  </div>
</div>

{/* 翻译为 */}
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-3 px-4">
    {list.map(item => (
      <div key={item.id} className="w-[120px] shrink-0">
        {/* 卡片内容 */}
      </div>
    ))}
  </div>
</div>
```

---

## 图片占位模式

骨架中 `style={{ backgroundColor: 'url(figma-image:unknown)' }}` 表示图片占位。

```tsx
{/* 骨架 */}
<div className="w-full h-[200px]" style={{ backgroundColor: 'url(figma-image:unknown)' }} />

{/* 翻译为 */}
<img src={bannerUrl} alt="" className="w-full h-[200px] object-cover" />
{/* 或使用组件库的 Image 组件 */}
<Image src={bannerUrl} className="w-full h-[200px] object-cover" />
```

---

## 列表循环模式

骨架中出现多个**结构相同**的子项时，翻译为 `map` 循环。

```tsx
{/* 骨架（3 个重复卡片） */}
<div className="flex flex-col gap-3">
  <div className="flex gap-3 p-4 bg-white rounded-xl">...</div>
  <div className="flex gap-3 p-4 bg-white rounded-xl">...</div>
  <div className="flex gap-3 p-4 bg-white rounded-xl">...</div>
</div>

{/* 翻译为 */}
<div className="flex flex-col gap-3">
  {list.map(item => (
    <div key={item.id} className="flex gap-3 p-4 bg-white rounded-xl">
      {/* 提取一个子项的结构，变量替换为 item.xxx */}
    </div>
  ))}
</div>
```

---

## Cell 列表模式

单行信息展示（label + value + 可选箭头）。

```tsx
{/* 翻译为 */}
<div className="flex justify-between items-center px-4 py-4 bg-white" onClick={handleClick}>
  <span>订单编号</span>
  <div className="flex items-center gap-1">
    <span className="text-gray-600">{order.orderNo}</span>
    <Icon name="arrow-right" size={12} />
  </div>
</div>
```

---

## 固定底部按钮

```tsx
{/* 单按钮 */}
<div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-200 safe-area-bottom">
  <Button variant="primary" size="large" block onClick={handleSubmit}>
    提交
  </Button>
</div>

{/* 双按钮 */}
<div className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-3 bg-white border-t border-gray-200 safe-area-bottom">
  <Button variant="outline" size="large" className="flex-1" onClick={handleCancel}>
    取消
  </Button>
  <Button variant="primary" size="large" className="flex-1" onClick={handleConfirm}>
    确认
  </Button>
</div>

{/* 需要在页面内容区添加底部占位 */}
<div className="pb-20">
  {/* 页面内容 */}
</div>
```

---

## 吸顶模式

页面滚动时固定在顶部的元素（标签页、筛选栏、搜索栏等）。

```tsx
<div className="sticky top-0 z-10 bg-white">
  <Tabs value={activeTab} onChange={setActiveTab}>
    <Tab value="all">全部</Tab>
    <Tab value="pending">待处理</Tab>
    <Tab value="done">已完成</Tab>
  </Tabs>
</div>
```

---

## 页面结构模板

```tsx
export default function PageName() {
  const [form, setForm] = useState({})
  
  const handleSubmit = () => {
    // TODO: 实现提交逻辑
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 内容卡片 */}
      <div className="bg-white px-4 py-4 mt-2">
        <div className="text-base font-medium mb-4">标题</div>
        {/* 内容 */}
      </div>

      {/* 弹性占位 */}
      <div className="flex-1" />

      {/* 底部按钮（若有） */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 safe-area-bottom">
        <Button variant="primary" size="large" block onClick={handleSubmit}>
          提交
        </Button>
      </div>
    </div>
  )
}
```
