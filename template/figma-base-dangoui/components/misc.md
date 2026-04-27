# 其他组件

## DuTag

```html
<!-- 基础标签 -->
<DuTag color="primary">标签文字</DuTag>

<!-- ghost 样式（描边） -->
<DuTag color="primary" bg="ghost" round>标签</DuTag>

<!-- solid 样式（实色背景） -->
<DuTag color="danger" bg="solid" :bordered="false">错误</DuTag>

<!-- 可关闭标签 -->
<DuTag color="primary" bg="soft" closeable @close="onClose">可关闭</DuTag>

<!-- 自定义颜色 -->
<DuTag :color="{ border: '#FF6B00', text: '#FF6B00', background: '#FFF3E8' }">自定义</DuTag>
```

**DuTag props**：
- `color`：颜色名或 `{ border, text, background }`
- `bg`：`'ghost'` | `'solid'` | `'soft'`
- `size`
- `round`：boolean
- `bordered`：boolean
- `closeable`：boolean
- `icon`

---

## DuSwitch

```html
<DuSwitch v-model:on="form.enabled" />
<DuSwitch v-model:on="form.notify" color="primary" />
<DuSwitch v-model:on="form.auto" disabled />
```

**DuSwitch props**：
- `v-model:on`
- `color`
- `disabled`

---

## DuUpload

```html
<!-- 基础图片上传 -->
<DuUpload
  v-model:value="fileList"
  action="/api/upload"
  :maxCount="9"
  uploadText="上传图片"
/>

<!-- 带徽标的大尺寸上传 -->
<DuUpload
  v-model:value="fileList"
  action="/api/upload"
  size="large"
  badge="封面"
  :mediaType="['image']"
  :beforeUpload="handleBeforeUpload"
/>
```

**DuUpload props**：
- `v-model:value`：`UploadFile[]`
- `action`：上传地址
- `maxCount`：最大数量
- `uploadText`：上传按钮文案
- `size`：`'large'` | `'normal'`
- `badge`：第一张图标签
- `disabled`
- `beforeUpload`：上传前处理函数
- `mediaType`：`('image' | 'video')[]`

---

## DuDivider

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Divider` / `Line` / `Separator` | `<DuDivider>` | `<DuDivider />` |

```html
<DuDivider />

<!-- 垂直分割线 -->
<DuDivider type="vertical" />

<!-- 带颜色和长度 -->
<DuDivider color="primary" length="80%" />

<!-- 带间距 -->
<DuDivider class="my-16" />
```

**DuDivider props**：
- `color`
- `type`：`'horizontal'` | `'vertical'`
- `length`

---

## DuRate

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Rate` / `Star` | `<DuRate>` | 见下方 |

```html
<!-- 基本用法 -->
<DuRate v-model:value="rating" />

<!-- 只读展示 -->
<DuRate :value="4.5" :disabled="true" />

<!-- 半星 -->
<DuRate v-model:value="rating" half />

<!-- 自定义数量和颜色 -->
<DuRate v-model:value="rating" :count="10" color="danger" />

<!-- 带文字 -->
<DuRate v-model:value="rating" size="large" with-text :text-list="['差', '较差', '一般', '好', '很好']" />
```

**DuRate props**：
- `value`：number，v-model 双向绑定
- `count`：number，总星数，默认 `5`
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`，默认 `'medium'`
- `color`：颜色值或色板颜色名，默认 `'#FC7E22'`
- `disabled`：boolean，禁用
- `half`：boolean，支持半选
- `withText`：boolean，显示文字（仅 `size="large"` 生效）
- `textList`：`string[]`，每个星级对应的文字

---

## DuDropdown

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Dropdown` / `DropdownMenu` | `<DuDropdown>` | 见下方 |

```html
<!-- 标签布局 -->
<DuDropdown
  v-model:visible="showFilter"
  v-model:value="filterValue"
  :options="filterOptions"
  layout="tag"
  @confirm="handleFilterConfirm"
/>

<!-- 列表布局 -->
<DuDropdown
  v-model:visible="showFilter"
  v-model:value="filterValue"
  :options="filterOptions"
  layout="list"
/>
```

**DuDropdown props**：
- `visible`：boolean，v-model 双向绑定
- `value`：`Record<string, any>`，v-model 选中值
- `options`：`FilterField[]`，筛选配置
- `layout`：`'tag'` | `'list'`，默认 `'tag'`
- `showFooter`：boolean，是否显示底部按钮，默认 `true`

---

## Sticky

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Sticky` | `<Sticky>` | 见下方 |

```html
<!-- 基本吸顶 -->
<Sticky>
  <div>吸顶内容</div>
</Sticky>

<!-- 设置偏移距离 -->
<Sticky :top="44">
  <Tabs v-model:value="activeTab">
    <Tab name="a">标签 A</Tab>
    <Tab name="b">标签 B</Tab>
  </Tabs>
</Sticky>
```

**Sticky props**：
- `top`：number，距顶部距离（px），默认 `0`
- `z`：number，z-index，默认 `99`

**插槽**：`default`（`v-slot="{ isSticky }"`，可获取是否吸顶状态）

---

## DuTagsPanel

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `TagsPanel` | `<DuTagsPanel>` | 见下方 |

```html
<!-- 基本用法 -->
<DuTagsPanel
  :tags="tags"
  add-text="添加标签"
  @add="handleAdd"
  @remove="handleRemove"
/>

<!-- 可折叠 -->
<DuTagsPanel
  :tags="tags"
  :can-toggle="true"
  :collapse-count="5"
  @add="handleAdd"
  @remove="handleRemove"
/>
```

**DuTagsPanel props**：
- `tags`：`{ text: string; value: string | number; canRemove?: boolean }[]`
- `addText`：string，添加按钮文案，默认 `'添加'`
- `canToggle`：boolean，是否可折叠/展开
- `collapseCount`：number，超过多少个显示展开按钮，默认 `10`

**事件**：`@add` / `@remove({ value })`

---

## DuTooltip

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Tooltip` | `<DuTooltip>` | 见下方 |

```html
<DuTooltip title="这是一段提示文字">
  <Button type="text">悬浮提示</Button>
</DuTooltip>
```

**DuTooltip props**：
- `title`：string，提示文案
- `extClass` / `extStyle`

---

## DuSteps

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Steps` / `Stepper` / `Progress` | `<DuSteps>` | 见下方 |

```html
<!-- 基本用法 -->
<DuSteps :active-index="1" :steps="[{ title: '步骤1' }, { title: '步骤2' }, { title: '步骤3' }]" />

<!-- ghost 样式 -->
<DuSteps :active-index="2" type="ghost" :steps="steps" />

<!-- 自定义颜色 -->
<DuSteps :active-index="1" color="primary" :steps="steps" />
```

**DuSteps props**：
- `activeIndex`：number，当前步骤索引
- `steps`：`{ title: string }[]`，步骤列表
- `status`：`'process'` | `'success'`，当前步骤状态
- `type`：`'default'` | `'ghost'`
- `color`：色板颜色名
- `extClass` / `extStyle`

---

## Theme

主题容器组件，用于切换子组件的主题样式。

```html
<Theme name="dark">
  <Button>深色主题按钮</Button>
</Theme>

<Theme name="product-a">
  <DuNavigationBar>Product A主题</DuNavigationBar>
</Theme>
```

**Theme props**：
- `name`：string，主题名称

---

## DuTransition

过渡动画组件，用于元素的显示/隐藏动画。

```html
<DuTransition :show="visible">
  <div>带动画的内容</div>
</DuTransition>
```

**DuTransition props**：
- `show`：boolean，是否显示
- `name`：`'fadeInUp'`，动画类型
