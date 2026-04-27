# 导航栏

## DuNavigationBar

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `NavigationBar` / `NavBar` / `Header` | `<DuNavigationBar>` | 见下方 |

```html
<!-- 基础导航栏（默认带返回按钮） -->
<DuNavigationBar />

<!-- 带标题 + 右侧分享 -->
<DuNavigationBar share @share="handleShare">标题</DuNavigationBar>

<!-- 右侧放按钮 -->
<DuNavigationBar share @share="handleShare">
  标题
  <template #right>
    <Button size="small" type="outline" color="default">按钮</Button>
  </template>
</DuNavigationBar>

<!-- 左侧首页按钮（back-icon="room"） -->
<DuNavigationBar back-icon="room">左边是首页按钮</DuNavigationBar>

<!-- 标题 + 搜索框并排（搜索框用 flex-auto w-0 包裹） -->
<DuNavigationBar share @share="handleShare">
  <div>标题</div>
  <div class="flex-auto w-0">
    <DuSearch bg="white" :placeholder="placeholders" readonly>
      <template #right>
        <Icon name="camera" />
        <DuDivider type="vertical" />
        <Icon name="scanning" />
      </template>
    </DuSearch>
  </div>
</DuNavigationBar>

<!-- 纯搜索框导航栏（无返回按钮，带颜色主题） -->
<DuNavigationBar color="secondary" :back="false">
  <div class="flex-auto w-0">
    <DuSearch bg="white" placeholder="搜索">
      <template #right>
        <Icon name="camera" />
        <DuDivider type="vertical" />
        <Icon name="scanning" />
      </template>
    </DuSearch>
  </div>
</DuNavigationBar>

<!-- 居中放 Tabs -->
<DuNavigationBar center>
  <Tabs size="large" v-model:value="tab">
    <Tab name="discovery">发现岛</Tab>
    <Tab name="joined">我的岛</Tab>
  </Tabs>
</DuNavigationBar>

<!-- 透明导航栏（深色背景页面） -->
<DuNavigationBar transparent transparentFrontColor="white" fixed placeholder>
  <template #default>
    <DuSearch v-model:value="keyword" placeholder="搜索" readonly @click="goSearchPage" />
  </template>
</DuNavigationBar>
```

**DuNavigationBar props**：
- `color`：色板颜色名（`'default'` | `'primary'` | `'secondary'` | `'white'` 等）
- `back`：boolean，显示返回按钮（默认 `true`）
- `backIcon`：自定义返回图标（如 `"room"` 显示首页图标）
- `share`：boolean，显示分享按钮
- `center`：boolean，内容居中
- `fixed`：boolean，固定定位
- `placeholder`：boolean，fixed 时占位
- `transparent`：boolean，透明背景
- `transparentFrontColor`：`'white'` | `'black'`，透明时文字颜色
- `appearThreshold`：number，滚动出现阈值
- `alwaysShowContent`：boolean，透明模式下始终显示内容

**Slots**：`left`、`default`（标题/搜索框/Tabs）、`right`

**模式识别**：
- 骨架中 `NavigationBar` / `NavBar` / `Header` 组件 → 使用 `DuNavigationBar`
- 导航栏内含 `Search` / `SearchBar` 子节点 → 在 `#default` slot 中放 `DuSearch`
- 标题和搜索框并排 → 标题用 `<div>`，搜索框用 `<div class="flex-auto w-0">` 包裹
- 导航栏内含 `Tabs` → 在 `#default` slot 中放 `Tabs`，加 `center` 属性
- 深色背景页面的导航栏 → 加 `transparent transparentFrontColor="white"`
- 无返回按钮 → 加 `:back="false"`

---

## DuSearch

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Search` / `SearchBar` | `<DuSearch>` | 见下方 |

```html
<DuSearch v-model:value="keyword" placeholder="搜索" clearable @confirm="handleSearch" />

<!-- 只读（点击跳转搜索页） -->
<DuSearch placeholder="搜索商品" readonly @click="goSearchPage" />

<!-- 带左右插槽 -->
<DuSearch v-model:value="keyword" placeholder="搜索">
  <template #left><Icon name="scan" size="20px" /></template>
  <template #right><Button type="text" @click="handleSearch">搜索</Button></template>
</DuSearch>
```

**DuSearch props**：
- `v-model:value`
- `placeholder`：string | string[]
- `clearable`：boolean
- `bg`：自定义背景色
- `readonly`：boolean
- `autofocus`：boolean

**Slots**：`left`、`right`

---

## DuSearchRight

搜索框右侧插槽容器，用于在 `DuSearch` 的 `#right` slot 中包裹多个元素。

```html
<DuSearch v-model:value="keyword" placeholder="搜索">
  <template #right>
    <DuSearchRight>
      <Icon name="camera" />
      <DuDivider type="vertical" />
      <Icon name="scanning" />
    </DuSearchRight>
  </template>
</DuSearch>
```

---

## DuNavigationBarRight

导航栏右侧插槽容器，用于在 `DuNavigationBar` 的 `#right` slot 中包裹多个元素。

```html
<DuNavigationBar>
  <template #right>
    <DuNavigationBarRight>
      <IconButton name="share" @click="handleShare" />
      <IconButton name="more" @click="handleMore" />
    </DuNavigationBarRight>
  </template>
</DuNavigationBar>
```

---

## DuActionButton

导航栏内的图标按钮，比 `IconButton` 更轻量，专用于导航栏场景。

```html
<DuNavigationBar>
  <template #right>
    <DuActionButton name="share" color="black" @click="handleShare" />
  </template>
</DuNavigationBar>
```

**DuActionButton props**：
- `name`：图标名称
- `color`：`'black'` | `'white'`
