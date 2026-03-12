# 代码生成示例

本文档展示了如何使用不同的框架和样式格式生成代码。

## 基本用法

### HTML + CSS（默认）

```typescript
import { convertFigmaToCode } from './src/index'

const result = await convertFigmaToCode({
  fileKey: 'your-file-key',
  nodeId: '123:456',
  framework: 'html',
  styleFormat: 'css'
})

console.log(result.code)
// 输出: HTML + <style> 标签
```

### Vue 3 + CSS

```typescript
const result = await convertFigmaToCode({
  fileKey: 'your-file-key',
  nodeId: '123:456',
  framework: 'vue',
  styleFormat: 'css'
})

console.log(result.code)
// 输出: Vue 3 <script setup> 组件，带 <style scoped>
```

### Vue 3 + UnoCSS

```typescript
const result = await convertFigmaToCode({
  fileKey: 'your-file-key',
  nodeId: '123:456',
  framework: 'vue',
  styleFormat: 'unocss'
})

console.log(result.code)
// 输出: Vue 3 组件，使用 UnoCSS 原子类名
```

### React + UnoCSS

```typescript
const result = await convertFigmaToCode({
  fileKey: 'your-file-key',
  nodeId: '123:456',
  framework: 'react',
  styleFormat: 'unocss'
})

console.log(result.code)
// 输出: React 函数组件，使用 UnoCSS 原子类名
```

### React + 内联样式

```typescript
const result = await convertFigmaToCode({
  fileKey: 'your-file-key',
  nodeId: '123:456',
  framework: 'react',
  styleFormat: 'inline'
})

console.log(result.code)
// 输出: React 组件，使用内联 style 对象
```

## 输出示例

### Vue + UnoCSS 输出示例

```vue
<script setup lang="ts">
// Component logic
</script>

<template>
  <div class="flex flex-col gap-2 p-4">
    <span class="text-base font-medium">标题</span>
    <div class="flex items-center">
      <!-- ... -->
    </div>
  </div>
</template>
```

### React + UnoCSS 输出示例

```tsx
import './styles.css'

export function Component() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <span className="text-base font-medium">标题</span>
      <div className="flex items-center">
        {/* ... */}
      </div>
    </div>
  )
}
```

## 支持的框架和样式格式

### 框架 (Framework)
- `html` - 纯 HTML + CSS（默认）
- `vue` - Vue 3 with `<script setup>`
- `react` - React 函数组件

### 样式格式 (StyleFormat)
- `css` - 传统 CSS（默认）
- `unocss` - UnoCSS 原子类名
- `inline` - 内联样式对象

## UnoCSS 映射规则

UnoCSS 转换器会将以下 CSS 属性映射到原子类名：

- `display: flex` → `flex`
- `flex-direction: column` → `flex-col`
- `gap: 8px` → `gap-2`
- `padding: 16px` → `p-4`
- `background-color: rgb(255, 255, 255)` → `bg-white`
- `color: rgb(0, 0, 0)` → `text-black`
- `border-radius: 8px` → `rounded-2`
- `font-size: 16px` → `text-4`
- `font-weight: 700` → `font-bold`

无法映射的属性会保留在内联样式中。
