# 核心翻译原则

**骨架即真相，1:1 还原**：骨架输出什么，翻译结果就对应什么。禁止任何形式的"优化"、"简化"、"抽象"、"省略"。

禁止行为：
1. **禁止修改值**：骨架中的数值、尺寸、颜色等，直接使用，不得推算、合并、编公式
2. **禁止省略元素**：骨架中的每个元素都必须翻译，不得因为"看起来是装饰"而跳过
3. **禁止丢失属性**：元素上的 className、style、尺寸等属性，抽组件时必须透传为 props

判断标准：翻译完成后，骨架中的每个节点、每个属性、每个数值，都能在翻译结果中找到对应。找不到 = 翻译错误。

**不确定时问用户**，不要自己猜。

---

## Vue → React 语法对照

| Vue 语法 | React 语法 |
|---|---|
| `class="..."` | `className="..."` |
| `v-if={condition}` | `{condition && <Element />}` |
| `v-for="item in list"` | `{list.map(item => <Element key={item.id} />)}` |
| `v-model:value={val}` | `value={val} onChange={setVal}` |
| `@click={fn}` | `onClick={fn}` |
| `@change={fn}` | `onChange={fn}` |
| `:prop={value}` | `prop={value}` |
| `<template #slot>` | `slotProp={<Element />}` 或 children |
| `{{ variable }}` | `{variable}` |

---

## 生成规则

1. **宽度不写死**：容器统一用 `w-full`，只有图标、头像等固定尺寸元素保留 `w-[Npx]`
2. **颜色用 token**：优先用项目 token 表；找不到时使用 Tailwind 任意值语法 `text-[#xxx]`
3. **动态内容**：静态文字改为 `{variable}`，在组件中声明对应 `useState`
4. **交互占位**：所有 `onClick`、`onChange` 加 `// TODO: 实现` 注释的方法
5. **图标名称**：从骨架 INSTANCE 名中提取，转为 kebab-case（`IconArrowRight` → `arrow-right`）
6. **className 合并**：需要额外样式时用 `className` prop，可配合 `clsx` / `cn` 工具函数
7. **单输入框禁止套 Form**：只有单个输入框或无 label 的输入框直接用 `Input`，不要包裹 `Form`
8. **TypeScript**：组件使用 `.tsx` 后缀，props 需定义类型接口
