# 布局模式规则

## 横滑容器

骨架中 `overflow-x: auto` + `flex` 横排 + `shrink-0` 子项，识别为横滑容器。

```html
<!-- 小程序用 scroll-view，H5 用 overflow-x-auto -->
<scroll-view scroll-x class="w-full">
  <div class="flex gap-12 px-15">
    <div v-for="item in list" :key="item.id" class="w-120 shrink-0">
      <!-- 卡片内容 -->
    </div>
  </div>
</scroll-view>
```

**要点**：子卡片加 `shrink-0`，首尾留白用 `px-15`

---

## 图片占位模式

骨架中 `backgroundColor: 'url(figma-image:unknown)'` 表示图片占位。

| 场景 | 骨架特征 | 翻译 |
|---|---|---|
| banner/头图 | `w-full h-[200px]` | `<Image :src="url" width="100%" height="200px" mode="aspectFill" />` |
| 列表封面 | `w-[80px] h-[80px] rounded-8` | `<Image :src="item.cover" width="80px" height="80px" radius="8px" />` |
| 宽度自适应 | `w-full aspect-video` | `<Image :src="url" width="100%" mode="widthFix" />` |
| 头像 | `w-[40px] rounded-full` | `<Avatar :src="user.avatar" size="normal" />` |

**mode**：`aspectFill`（填充裁剪）、`aspectFit`（完整留白）、`widthFix`（宽度撑满）

---

## 列表循环模式

骨架中多个**结构相同**的子项 → `v-for` 循环。

```html
<!-- 骨架有 3 个重复卡片 -->
<div class="flex flex-col gap-12">
  <div v-for="item in list" :key="item.id" class="flex gap-12 p-16 bg-white rounded-12">
    <!-- 提取一个子项结构，变量替换为 item.xxx -->
  </div>
</div>
```

---

## Cell 列表模式

单行信息展示（label + value + 可选箭头）。

```html
<div class="flex justify-between items-center px-15 py-16 bg-white" @click="handleClick">
  <span>订单编号</span>
  <div class="flex items-center gap-4">
    <span class="c-text-2">{{ order.orderNo }}</span>
    <Icon name="arrow-right" size="12px" />
  </div>
</div>
```

**要点**：有箭头 → 加 `@click`，纯展示可用 `FormItem`

---

## 固定底部按钮

```html
<!-- 单按钮 -->
<div class="fixed bottom-0 left-0 right-0 px-15 py-12 bg-white safe-area-bottom b-t-1 b-t-solid b-hex-E5E5E5">
  <Button color="primary" size="large" full @click="handleSubmit">提交</Button>
</div>

<!-- 双按钮 -->
<div class="fixed bottom-0 left-0 right-0 flex gap-12 px-15 py-12 bg-white safe-area-bottom b-t-1 b-t-solid b-hex-E5E5E5">
  <Button type="outline" color="primary" size="large" class="flex-1" @click="handleCancel">取消</Button>
  <Button color="primary" size="large" class="flex-1" @click="handleConfirm">确认</Button>
</div>

<!-- 内容区加底部占位 -->
<div class="pb-[80px]">...</div>
```

**要点**：必须加 `safe-area-bottom`，双按钮用 `flex-1` 等宽

---

## 吸顶模式

页面滚动时固定在顶部的元素（Tabs、筛选栏）。

```html
<Sticky :top="44">
  <Tabs v-model:value="activeTab" color="primary">
    <Tab name="all">全部</Tab>
    <Tab name="pending">待处理</Tab>
  </Tabs>
</Sticky>
```

**要点**：`top` 为导航栏高度（44px），吸顶内容加白色背景

---

## 分组卡片模式

多个 Cell 组成的信息卡片（订单详情、个人信息等）。

```html
<div class="bg-white rounded-12 mx-15 mt-12 overflow-hidden">
  <Form labelSize="80">
    <FormItem label="订单编号" showBorder>
      <span class="c-text-2">{{ order.orderNo }}</span>
    </FormItem>
    <FormItem label="下单时间" showBorder>
      <span class="c-text-2">{{ order.createTime }}</span>
    </FormItem>
    <FormItem label="支付方式">
      <span class="c-text-2">{{ order.payMethod }}</span>
    </FormItem>
  </Form>
</div>
```

**要点**：卡片加 `overflow-hidden` 配合圆角，最后一行不加 `showBorder`

---

## 页面结构模板

```html
<template>
  <div class="flex flex-col min-h-screen bg-page">
    <!-- 内容卡片 -->
    <div class="bg-white px-15 py-16 mt-8">
      <div class="text-h4 fw-500 mb-16">标题</div>
    </div>

    <div class="flex-1" />

    <!-- 底部按钮 -->
    <div class="px-15 py-12 safe-area-bottom bg-white b-t-1 b-t-solid b-hex-E5E5E5">
      <Button color="primary" size="large" full @click="handleSubmit">提交</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: 按需补充
</script>
```
