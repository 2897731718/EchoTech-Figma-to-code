# 标签页

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Tabs` / `Tab` / `TabBar` | `<Tabs>` + `<Tab>` | 见下方 |

```html
<!-- 基础标签页 -->
<Tabs v-model:value="activeTab" color="primary">
  <Tab name="tab1">推荐</Tab>
  <Tab name="tab2">最新</Tab>
  <Tab name="tab3">热门</Tab>
</Tabs>

<!-- tag 风格 -->
<Tabs v-model:value="activeTab" type="tag" color="primary">
  <Tab name="all">全部</Tab>
  <Tab name="sale">在售</Tab>
</Tabs>

<!-- 带左右插槽 -->
<Tabs v-model:value="activeTab">
  <template #left><Icon name="filter" size="16px" /></template>
  <Tab name="tab1">Tab1</Tab>
  <Tab name="tab2">Tab2</Tab>
  <template #right><IconButton name="search" /></template>
</Tabs>
```

**Tabs props**：
- `v-model:value`：当前激活 tab 的 name
- `color`：色板颜色名
- `type`：`'default'` | `'tag'` | `'text'`
- `size`：`'normal'` | `'large'`
- `indicator`：自定义指示器样式

**Tab props**：
- `name`：标识符

**Slots**：`left`、`right`、`default`（放 Tab）

---

## TabPane

标签页内容面板，配合 `Tabs` 使用，用于切换显示不同内容。

```html
<Tabs v-model:value="activeTab">
  <Tab name="tab1">Tab1</Tab>
  <Tab name="tab2">Tab2</Tab>
</Tabs>
<TabPane name="tab1" :active="activeTab === 'tab1'">
  Tab1 内容
</TabPane>
<TabPane name="tab2" :active="activeTab === 'tab2'">
  Tab2 内容
</TabPane>
```

---

## TabsRight

Tabs 右侧插槽容器，用于在 `Tabs` 的 `#right` slot 中包裹多个元素。

```html
<Tabs v-model:value="activeTab">
  <Tab name="tab1">Tab1</Tab>
  <template #right>
    <TabsRight>
      <IconButton name="filter" />
      <IconButton name="search" />
    </TabsRight>
  </template>
</Tabs>
```
