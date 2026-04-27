# Badge 组件

## 骨架特征

```html
<Badge class="... absolute ..." type="NumberReddot" size="Normal">
  <template #数字>数字内容</template>
</Badge>
<Tag />  <!-- Badge 后面紧跟的元素 -->
```

## 翻译规则

DuBadge 是**包裹型组件**，需要把相邻元素包裹进去：

```vue
<DuBadge :value="数字内容">
  <Tag />  <!-- 被包裹的元素 -->
</DuBadge>
```

## Props 映射

| 骨架 | DuBadge |
|------|---------|
| `<template #数字>6</template>` | `:value="6"` |
| `<template #数字>99+</template>` | `:value="100" :max="99"` |
| 无文本内容 | `:dot` (只显示红点) |

## 翻译步骤

1. 识别 `<Badge class="... absolute ...">` 
2. 提取文本内容作为 `:value`
3. 找到 Badge **后面紧邻的非 absolute 元素**（通常是 Tag/图片/图标容器）
4. 用 `<DuBadge>` 包裹该元素
5. 删除原 Badge 标签

## 示例

骨架：
```html
<div class="relative">
  <Badge class="absolute" type="NumberReddot">
    <template #6>6</template>
  </Badge>
  <Tag class="w-48 h-48" />
  <span>Labubu</span>
</div>
```

翻译后：
```vue
<div class="relative">
  <DuBadge :value="6">
    <Tag class="w-48 h-48" />
  </DuBadge>
  <span>Labubu</span>
</div>
```

## 组件引入

```ts
import { DuBadge } from 'your-ui-lib'
```
