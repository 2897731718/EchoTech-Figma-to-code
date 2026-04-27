# 列表展示

## DuCard

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Card` | `<DuCard>` | 见下方 |

```html
<!-- 基本卡片 -->
<DuCard title="卡片标题">
  <p>卡片内容</p>
</DuCard>

<!-- 带副标题和引导操作 -->
<DuCard title="订单列表" subtitle="共 3 笔" guide-text="查看全部" @guide-tap="handleViewAll">
  <p>内容</p>
</DuCard>

<!-- 大标题 -->
<DuCard title="模块标题" size="large">
  <p>内容</p>
</DuCard>

<!-- 折叠模式 -->
<DuCard title="详细信息" mode="collapse" :default-open="false">
  <p>折叠内容</p>
</DuCard>

<!-- 带信息提示 -->
<DuCard title="标题" info-text="帮助说明" @info-tap="showHelp">
  <p>内容</p>
</DuCard>

<!-- 隐藏头部 -->
<DuCard :show-header="false">
  <p>无标题卡片内容</p>
</DuCard>
```

**DuCard props**：
- `title`：卡片标题
- `subtitle`：副标题
- `guideText`：右侧引导文字，默认 `'查看更多'`
- `infoText`：信息图标旁的文字
- `actionIcon`：右侧操作图标
- `mode`：`'normal'` | `'collapse'`，默认 `'normal'`
- `size`：`'normal'` | `'large'`，默认 `'normal'`
- `defaultOpen`：折叠模式默认展开状态
- `open`：受控折叠状态
- `showHeader`：boolean，是否显示头部，默认 `true`
- `contentStyle`：内容区自定义样式
- `extClass` / `extStyle`

**插槽**：`default`（内容）/ `left`（标题右侧补充）/ `right`（右侧自定义）
**事件**：`@guideTap` / `@infoTap` / `@actionTap` / `@toggleOpen(open)`

---

## DuEmpty

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Empty` / `NoData` | `<DuEmpty>` | 见下方 |

```html
<!-- 默认空状态 -->
<DuEmpty text="暂无数据" />

<!-- 带操作按钮 -->
<DuEmpty text="暂无内容" button-text="去添加" @button-click="handleAdd" />

<!-- 指定预设图片类型 -->
<DuEmpty image="networkError" text="网络错误" button-text="重试" />
<DuEmpty image="searchEmpty" text="搜索无结果" />
<DuEmpty image="contentDeleted" text="内容已删除" />

<!-- 自定义图片 -->
<DuEmpty image="https://xxx.com/custom.png" text="自定义空状态" />
```

**DuEmpty props**：
- `image`：预设类型或自定义图片 URL，默认 `'empty'`
  - 预设值：`empty` / `networkError` / `offline` / `serviceError` / `loadError` / `success` / `error` / `searchEmpty` / `contentDeleted` / `contentInvisible` / `notFound` / `verifying` / `verifySucceeded` / `verifyFailed`
- `text`：描述文案
- `buttonText`：按钮文案（有值才显示按钮）
- `extClass` / `extStyle`

**事件**：`@buttonClick`

---

## DuSkeleton

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Skeleton` | `<DuSkeleton>` | 见下方 |

```html
<!-- 基本用法：loading 时显示骨架，加载完显示真实内容 -->
<DuSkeleton :loading="loading">
  <template #template>
    <!-- 骨架占位 -->
    <div class="flex gap-12 p-16">
      <DuSkeletonAvatar size="48px" />
      <div class="flex-1 flex flex-col gap-8">
        <DuSkeletonParagraph row-width="60%" />
        <DuSkeletonParagraph row-width="100%" />
      </div>
    </div>
  </template>
  <!-- 真实内容 -->
  <div>加载完成的内容</div>
</DuSkeleton>

<!-- 矩形骨架（图片占位） -->
<DuSkeletonRectangle width="120px" :aspect-ratio="1" />

<!-- 头像骨架 -->
<DuSkeletonAvatar size="40px" />

<!-- 段落骨架 -->
<DuSkeletonParagraph row-width="80%" row-height="14px" gap="8px" />
```

**DuSkeleton props**：
- `loading`：boolean，是否显示骨架，默认 `true`
- `extClass` / `extStyle`

**DuSkeletonAvatar props**：
- `size`：number | string，头像尺寸，默认 `56`，推荐使用带单位字符串如 `"48px"`

**DuSkeletonParagraph props**：
- `rowWidth`：string，宽度，默认 `'100%'`
- `rowHeight`：number | string，行高，默认 `16`，推荐使用带单位字符串如 `"14px"`
- `gap`：number | string，行间距，默认 `8`，推荐使用带单位字符串如 `"8px"`

**DuSkeletonRectangle props**：
- `width`：number | string，宽度，默认 `120`，推荐使用带单位字符串如 `"120px"`
- `aspectRatio`：number，宽高比，默认 `1`
