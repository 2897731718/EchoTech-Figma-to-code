# Skeleton 骨架屏组件

## 组件

| 组件 | 说明 |
|------|------|
| `DuSkeleton` | 骨架屏容器 |
| `DuSkeletonAvatar` | 头像占位 |
| `DuSkeletonParagraph` | 段落占位 |
| `DuSkeletonRectangle` | 矩形占位 |

## DuSkeleton Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loading` | `boolean` | `true` | 是否显示骨架屏 |

## DuSkeleton Slots

| Slot | 说明 |
|------|------|
| `template` | 骨架屏模板 |
| `default` | 加载完成后显示的内容 |

## 用法

```vue
<DuSkeleton :loading="loading">
  <template #template>
    <div class="flex gap-12">
      <DuSkeletonAvatar />
      <DuSkeletonParagraph />
    </div>
  </template>
  <!-- 实际内容 -->
  <div>加载完成的内容</div>
</DuSkeleton>
```

## 骨架翻译

骨架中的 `<Skeleton>` → `DuSkeleton`

## 组件引入

```ts
import { DuSkeleton, DuSkeletonAvatar, DuSkeletonParagraph, DuSkeletonRectangle } from 'your-ui-lib'
```
