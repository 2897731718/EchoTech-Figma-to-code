# 项目 Figma 规范 - CustomUI

> 基于 your-ui-lib@3.6.14 自动生成，可手动补充修改。

---

## 核心翻译原则

**骨架即真相，1:1 还原**：骨架输出什么，翻译结果就对应什么。禁止任何形式的"优化"、"简化"、"抽象"、"省略"。

禁止行为：
1. **禁止修改值**：骨架中的数值、尺寸、颜色等，直接使用，不得推算、合并、编公式
2. **禁止省略元素**：骨架中的每个元素都必须翻译，不得因为"看起来是装饰"而跳过
3. **禁止丢失属性**：元素上的 class、style、尺寸等属性，抽组件时必须透传为 props

判断标准：翻译完成后，骨架中的每个节点、每个属性、每个数值，都能在翻译结果中找到对应。找不到 = 翻译错误。

**不确定时问用户**，不要自己猜。

---

## 组件库

**包名**：`your-ui-lib`
**前缀**：`Du`（`<Button>` 和 `<Button>` 均可，统一用 `Du` 前缀）

### 组件引入

按需引入，在 `<script setup>` 顶部添加 import，**只引入当前文件实际用到的组件**：

```ts
// 示例：按需引入，不要全量引入
import { Button, DuInput, Icon, DuSelect, DuDivider } from 'your-ui-lib'
import { Form, FormItem, DuPopup, DuTag, DuSwitch, DuTextarea, DuUpload } from 'your-ui-lib'
```

---

## 业务组件映射

<!--
骨架中未识别的 INSTANCE 节点会附带 <!-- figma-node: xxx --> 注释。
翻译时按本表决策，三种情况：
  1. 文件路径为 "-"  → 已知基础组件，直接使用，不递归
  2. 文件路径有值    → 已生成的业务组件，直接 import，不递归
  3. 未匹配          → 询问用户是否生成、保存在哪里，确认后递归拉取该 figma-node 生成子组件文件，完成后补充本表
-->

| Figma 组件名（模糊匹配） | 项目组件 | 文件路径 | 备注 |
|---|---|---|---|
| icon/* / Icon* / Arrow* / Chevron* / Close* | `Icon` | - | 基础组件 |
| Button* / Btn* / Submit* | `Button` | - | 基础组件 |
| Input* / InputFrame* / TextField* | `DuInput` | - | 基础组件 |
| Textarea* | `DuTextarea` | - | 基础组件 |
| FormItem* | `FormItem` | - | 基础组件 |
| Picker* / DatePicker* / Select* / Dropdown* | `DuSelect` | - | 基础组件 |
| Divider* / Line* / Separator* | `DuDivider` | - | 基础组件 |
| Popup* / Sheet* / BottomSheet* | `DuPopup` | - | 基础组件 |
| Tag* | `DuTag` | - | 基础组件 |
| Switch* | `DuSwitch` | - | 基础组件 |
| Upload* | `DuUpload` | - | 基础组件 |
| NavigationBar* / NavBar* / Header* | `DuNavigationBar` | - | 基础组件 |
| IconButton* | `IconButton` | - | 基础组件 |
| Tabs* / Tab* | `Tabs` + `Tab` | - | 基础组件 |
| Avatar* | `Avatar` | - | 基础组件 |
| AvatarGroup* | `AvatarGroup` | - | 基础组件 |
| Badge* | `DuBadge` | - | 基础组件 |
| Image* / Img* / Photo* | `Image` | - | 基础组件 |
| Search* / SearchBar* | `DuSearch` | - | 基础组件 |
| Swiper* / Carousel* | `DuSwiper` + `DuSwiperItem` | - | 基础组件 |
| Dialog* / Confirm* / Alert* | `DuDialog` | - | 基础组件 |
| ActionSheet* | `DuActionSheet` | - | 基础组件 |
| Toast* | `DuToast` | - | 基础组件 |
| Snackbar* | `DuSnackbar` | - | 基础组件 |
| NoticeBar* / Notice* | `DuNoticeBar` | - | 基础组件 |
| Empty* / NoData* | `DuEmpty` | - | 基础组件 |
| Card* | `DuCard` | - | 基础组件 |
| Skeleton* | `DuSkeleton` | - | 基础组件 |
| Steps* / Step* / Stepper* | `DuSteps` | - | 基础组件 |
| Checkbox* | `DuCheckbox` | - | 基础组件 |
| Radio* | `DuRadio` | - | 基础组件 |
| Picker* / PickerView* | `DuPicker` / `DuPickerView` | - | 基础组件 |
| Cascader* | `DuCascader` | - | 基础组件 |
| Calendar* | `DuCalendar` | - | 基础组件 |
| InputNumber* / Stepper* | `DuInputNumber` | - | 基础组件 |
| Rate* / Star* | `DuRate` | - | 基础组件 |
| Dropdown* / DropdownMenu* | `DuDropdown` | - | 基础组件 |
| Sticky* | `Sticky` | - | 基础组件 |
| TagsPanel* | `DuTagsPanel` | - | 基础组件 |
| Tooltip* | `DuTooltip` | - | 基础组件 |

<!-- 每次递归生成新组件后，在此补充一行，例如：
| ProductCard | `ProductCard` | src/components/ProductCard.vue | 已生成 |
-->

---

## 组件映射规则

Figma 骨架中识别到 INSTANCE 节点时，按以下规则映射到 CustomUI 组件。

### 图标

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Icon` / `Arrow` / `Chevron` / `Close` / `Search` | `<Icon>` | `<Icon name="arrow-right" size="16px" />` |

- `name`：从节点名推断（如 `IconArrowRight` → `arrow-right`，转为 kebab-case）
- `size`：从骨架的 `w-[Npx]` 读取数字
- `color`：若骨架有颜色，转为 your-ui-lib 色板名或直接用 hex

```html
<Icon name="arrow-right" size="12px" />
<!-- color 可用色板名或 CSS 颜色值 -->
<Icon name="close" size="20px" color="primary" />
<Icon name="search" size="20px" extClass="custom-icon" />
```

**Icon props**：
- `name`：图标名（iconfont 名或图片链接）
- `size`：string | number，推荐使用带单位字符串如 `"20px"`
- `color`：色板颜色名或 CSS 颜色值
- `extClass`：自定义 class

### 按钮

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Button` / `Btn` / `Submit` | `<Button>` | 见下方 |

```html
<!-- 主按钮，全宽 -->
<Button color="primary" type="primary" size="large" full @click="handleSubmit">提交</Button>

<!-- 描边按钮 -->
<Button type="outline" color="primary" @click="fn">取消</Button>

<!-- 文字按钮 -->
<Button type="text" color="primary" @click="fn">查看详情</Button>

<!-- 带图标 -->
<Button color="primary" icon="arrow-right" iconPosition="right" @click="fn">下一步</Button>

<!-- 加载中 -->
<Button color="primary" :loading="submitting" full @click="handleSubmit">提交</Button>
```

**Button props**：
- `color`：色板颜色名（primary / danger / warning 等）
- `type`：`'text'` | `'primary'` | `'secondary'` | `'outline'`
- `size`：`'small'` | `'mini'` | `'normal'` | `'medium'` | `'large'`
- `full`：boolean，全宽
- `loading`：boolean
- `disabled`：boolean
- `icon`：图标名
- `iconPosition`：`'left'` | `'right'`
- `arrowRight`：boolean
- `extClass`：自定义 class

### 输入框

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Input` / `InputFrame` / `TextField` | `<DuInput>` | 见下方 |
| `FormItem` 且变体为 `Type=Input_frame`（无 label） | `<DuInput>` | 直接用，不套 Form |
| `FormItem` 且有 label 文字 | `<FormItem>` + `<DuInput>` | 套 Form |
| `Textarea` | `<DuTextarea>` | 见下方 |

```html
<!-- 外边框样式（bordered），适合独立输入框场景 -->
<DuInput v-model:value="form.name" placeholder="请输入" bordered />

<!-- 隐藏底部分割线（withoutBorder），适合自定义布局 -->
<DuInput v-model:value="form.name" placeholder="请输入" withoutBorder />

<!-- 默认样式（有底部分割线，不加 bordered / withoutBorder） -->
<DuInput v-model:value="form.name" placeholder="请输入" />

<!-- 带前缀文本 -->
<DuInput v-model:value="form.phone" placeholder="请输入手机号" prefix="+86" />

<!-- 带后缀文本 -->
<DuInput v-model:value="form.amount" placeholder="请输入金额" suffix="元" />

<!-- 带右侧图标 + 清除按钮 -->
<DuInput v-model:value="form.search" placeholder="搜索" rightIcon="search" allowClear />

<!-- 密码输入 -->
<DuInput v-model:value="form.password" type="password" placeholder="请输入密码" />

<!-- 多行文本 -->
<DuTextarea v-model:value="form.desc" placeholder="请输入" :maxlength="200" showCount />

<!-- 多行文本，带外边框 -->
<DuTextarea v-model:value="form.desc" placeholder="请输入" bordered :maxlength="-1" />
```

**DuInput props**：
- `v-model:value`
- `type`：`'text'` | `'number'` | `'idcard'` | `'digit'` | `'password'`
- `placeholder`
- `bordered`：boolean，外边框样式（适合独立输入框）
- `withoutBorder`：boolean，隐藏底部分割线
- `disabled`
- `maxlength`
- `inputAlign`：文字对齐
- `allowClear`：boolean，显示清除按钮
- `rightIcon`：右侧图标名
- `prefix`：前缀文本
- `suffix`：后缀文本
- `extClass`

**DuTextarea props**：
- `v-model:value`
- `placeholder`
- `bordered`：boolean
- `showCount`：boolean
- `maxlength`：number（-1 为无限制）

### 选择器

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Picker` / `DatePicker` / `Select` / `Dropdown` | `<DuSelect>` | 见下方 |

```html
<!-- 基础选择器 -->
<DuSelect
  v-model:value="form.year"
  v-model:open="yearPickerOpen"
  :options="YEAR_OPTIONS"
  title="选择年份"
/>

<!-- 多选 + 可搜索 -->
<DuSelect
  v-model:value="form.tags"
  v-model:open="tagsOpen"
  :options="TAG_OPTIONS"
  title="选择标签"
  mode="multiple"
  filterable
  withConfirm
/>

<!-- 在 FormItem 中使用，自动显示表单项样式 -->
<DuSelect
  v-model:value="form.bank"
  v-model:open="bankOpen"
  :options="BANK_OPTIONS"
  title="选择银行"
  formItem
/>
```

**DuSelect props**：
- `v-model:value`
- `v-model:open`
- `options`：`SelectOption[]`（`{ label, value, disabled? }`）
- `title`：placeholder 兼弹出层标题
- `mode`：`'multiple'`，多选
- `filterable`：boolean，可搜索
- `withConfirm`：boolean，带确认按钮
- `formItem`：boolean，在 FormItem 中时自动显示表单项样式

### 分割线

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

### 弹窗

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Popup` / `Sheet` / `BottomSheet` | `<DuPopup>` | 见下方 |

```html
<!-- 底部弹出，带标题栏和关闭按钮 -->
<DuPopup
  v-model:visible="popupVisible"
  title="选择选项"
  type="bottom"
  headerVisible
  closable
  maskClick
  safeArea
>
  <!-- 内容 -->
</DuPopup>

<!-- 居中弹出，标题居中 -->
<DuPopup
  v-model:visible="centerPopupVisible"
  title="提示"
  type="center"
  titleAlign="center"
  headerVisible
  closable
>
  <!-- 内容 -->
</DuPopup>

<!-- 顶部弹出，不显示内置头部（自定义头部） -->
<DuPopup
  v-model:visible="topPopupVisible"
  type="top"
  :headerVisible="false"
  :maskClick="false"
>
  <!-- 自定义头部 + 内容 -->
</DuPopup>
```

**DuPopup props**：
- `v-model:visible`
- `title`
- `titleAlign`：`'center'` | `'default'`（default 左对齐）
- `headerVisible`：boolean，显示内置头部栏
- `type`：`'center'` | `'top'` | `'bottom'`
- `maskClick`：boolean，点击遮罩关闭
- `closable`：boolean，显示关闭按钮（需同时开启 `headerVisible`）
- `safeArea`：boolean，自带 safe area
- `extClass`

### 标签

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

### 开关

```html
<DuSwitch v-model:on="form.enabled" />
<DuSwitch v-model:on="form.notify" color="primary" />
<DuSwitch v-model:on="form.auto" disabled />
```

**DuSwitch props**：
- `v-model:on`
- `color`
- `disabled`

### 上传

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

### 表单

**展示行 vs 输入框判断规则：**

> **只有单个输入框、或没有 label 的输入框，直接用 `DuInput`，禁止套 `Form`。**

连续多个「label + 输入框」行，且 label 宽度视觉一致时，才用 `Form` + `FormItem` 包裹。

**Form props**：
- `model`：表单数据对象（`:model`）
- `labelSize`：label 固定宽度 px 字符串，如 `"80"`
- `labelAlign`：`'left'` | `'right'`
- `layout`：`'horizontal'` | `'vertical'`
- **注意：Form 没有 `border` prop**，分割线通过 FormItem 的 `showBorder` 控制

**FormItem props**：
- `label`：左侧标签文字
- `labelSize`
- `labelAlign`
- `layout`：`'horizontal'` | `'vertical'`
- `showBorder`：boolean，显示底部边框分割线
- `required`：boolean
- `tips`：提示文本
- `justify`：`'end'` | `'start'`，内容水平对齐
- `items`：`'center'` | `'start'`，内容垂直对齐（horizontal 模式）
- `extClass`

```html
<!-- 标准表单：showBorder 控制分割线，horizontal 布局 -->
<Form :model="form" labelSize="80" labelAlign="right" layout="horizontal">
  <FormItem label="银行卡号" showBorder>
    <DuInput v-model:value="form.bankCard" placeholder="请输入" />
  </FormItem>
  <FormItem label="开户银行" showBorder>
    <DuSelect
      v-model:value="form.bank"
      v-model:open="bankOpen"
      :options="BANK_OPTIONS"
      title="请选择银行"
      formItem
    />
  </FormItem>
  <FormItem label="手机号">
    <DuInput v-model:value="form.phone" placeholder="请输入手机号" type="number" />
  </FormItem>
</Form>

<!-- 垂直布局表单 -->
<Form :model="form" layout="vertical">
  <FormItem label="备注" layout="vertical" required tips="最多200字">
    <DuTextarea v-model:value="form.remark" placeholder="请输入" :maxlength="200" showCount />
  </FormItem>
</Form>
```

### 导航栏

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

**配套组件**：
- `DuSearch`：搜索框，可通过 `#right` slot 添加图标（camera、scanning 等）

**模式识别**：
- 骨架中 `NavigationBar` / `NavBar` / `Header` 组件 → 使用 `DuNavigationBar`
- 导航栏内含 `Search` / `SearchBar` 子节点 → 在 `#default` slot 中放 `DuSearch`
- 标题和搜索框并排 → 标题用 `<div>`，搜索框用 `<div class="flex-auto w-0">` 包裹
- 导航栏内含 `Tabs` → 在 `#default` slot 中放 `Tabs`，加 `center` 属性
- 深色背景页面的导航栏 → 加 `transparent transparentFrontColor="white"`
- 无返回按钮 → 加 `:back="false"`

### 图标按钮

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| 位于导航栏/工具栏首尾的单独 Icon INSTANCE | `<IconButton>` | 见下方 |

```html
<IconButton name="share" @click="handleShare" />
<IconButton name="more" size="large" color="primary" @click="handleMore" />
<IconButton name="close" text="关闭" @click="handleClose" />
<IconButton name="setting" disabled />
```

**IconButton props**：
- `name`：图标名（kebab-case）
- `icon`：图标对象（优先级高于 name）
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`
- `iconSize`：string，自定义图标大小
- `color`：色板颜色名
- `text`：图标下方文字
- `textColor`：文字颜色
- `disabled`：boolean
- `extClass` / `extStyle`

**模式识别**：骨架中可点击位置的单独 Icon（导航栏左右、列表行尾箭头）→ `IconButton`

### 标签页

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

### 头像

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Avatar` | `<Avatar>` | 见下方 |
| `AvatarGroup` | `<AvatarGroup>` | 见下方 |

```html
<Avatar src="https://..." size="normal" />
<Avatar src="https://..." size="small" type="primary" bordered />

<!-- 头像组 -->
<AvatarGroup :avatars="avatarUrls" size="mini" :limit="5" reverse />
```

**Avatar props**：
- `src`：图片地址
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`
- `type`：`'primary'` | `'trade'` | `'success'` | `'error'` | `'default'` | `'white'`
- `bordered`：boolean，显示边框
- `icon`：无图片时显示的图标
- `iconColor`
- `extClass` / `extStyle`

**AvatarGroup props**：
- `avatars`：`string[]`，头像 URL 数组
- `size` / `type` / `bordered`：同 Avatar
- `limit`：最大显示数量（0 为不限制）
- `reverse`：boolean，反向堆叠
- `gap`：number，堆叠间距

### 徽标

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Badge` / 角标 | `<DuBadge>` | 见下方 |

```html
<!-- 数字徽标 -->
<DuBadge :value="5" color="error">
  <Icon name="notification" size="24px" />
</DuBadge>

<!-- 红点 -->
<DuBadge dot color="error">
  <Avatar src="https://..." />
</DuBadge>

<!-- 最大值 -->
<DuBadge :value="120" :max="99" color="primary">
  <div>消息</div>
</DuBadge>
```

**DuBadge props**：
- `value`：string | number，显示内容
- `dot`：boolean，红点模式
- `color`：`'primary'` | `'error'` | `'warning'` 等
- `max`：number，超过时显示 `max+`
- `alwaysShow`：boolean，value 为 0 时也显示

**Slots**：`default`（被包裹的内容）

### 图片

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| 骨架中 `backgroundColor: 'url(figma-image:unknown)'` | `<Image>` | 见下方 |

```html
<Image src="imageUrl" width="100px" height="100px" radius="8px" mode="aspectFill" />
<Image src="coverUrl" width="100%" height="200px" mode="widthFix" />
```

**Image props**：
- `src`：图片地址
- `mode`：`'aspectFit'` | `'aspectFill'` | `'widthFix'`
- `width`：number | string（默认 `'100%'`），推荐使用带单位字符串如 `"80px"` 或 `"100%"`
- `height`：number | string（默认 `'100%'`），推荐使用带单位字符串如 `"80px"` 或 `"100%"`
- `radius`：number | string，圆角，推荐使用带单位字符串如 `"8px"`
- `showMenuByLongPress`：boolean
- `extClass` / `extStyle`

**图片占位翻译规则**：骨架中 `:style="{ backgroundColor: 'url(figma-image:unknown)' }"` → 替换为 `<Image :src="变量名" />`，尺寸从骨架 class 中读取

### 搜索

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

### 轮播

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Swiper` / `Carousel` / `Banner` | `<DuSwiper>` | 见下方 |

```html
<DuSwiper autoplay>
  <DuSwiperItem v-for="item in banners" :key="item.id">
    <Image :src="item.image" width="100%" height="150px" />
  </DuSwiperItem>
</DuSwiper>
```

**DuSwiper props**：
- `indicatorType`：`'bar-full'` | `'bar'` | `'number'`
- `autoplay`：boolean
- `extClass` / `extStyle`

**DuSwiperItem**：无 props，纯 slot 容器

### 对话框

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Dialog` / `Confirm` / `Alert` | `<DuDialog>` | 见下方 |

```html
<!-- 基本用法：v-model 控制显隐 -->
<DuDialog v-model:visible="showDialog" title="确认操作">
  <p>确定要删除该内容吗？</p>
</DuDialog>

<!-- 自定义按钮文案 -->
<DuDialog
  v-model:visible="showDialog"
  title="提示"
  ok-text="确认"
  cancel-text="返回"
  @confirm="handleConfirm"
  @cancel="handleCancel"
>
  <p>操作不可撤销，是否继续？</p>
</DuDialog>

<!-- 垂直按钮排列 -->
<DuDialog v-model:visible="showDialog" title="选择" action-layout="vertical">
  <p>内容</p>
</DuDialog>

<!-- ref 命令式调用 -->
<DuDialog ref="dialogRef" title="提示">内容</DuDialog>
<!-- dialogRef.value.open({ title: '动态标题' }) -->
```

**DuDialog props**：
- `visible`：boolean，v-model 双向绑定
- `title`：弹窗标题
- `headerVisible`：boolean，是否展示头部栏，默认 `true`
- `closable`：boolean，是否展示关闭按钮，默认 `false`
- `actionLayout`：`'horizontal'` | `'vertical'`，按钮排列方式，默认 `'horizontal'`
- `okText`：确认按钮文字，默认 `'确定'`
- `cancelText`：取消按钮文字，默认 `'取消'`
- `extClass` / `extStyle` / `maskClass` / `maskStyle`

**事件**：`@confirm` / `@cancel` / `@close`
**方法**（ref）：`open(options)` / `close()`

### 动作面板

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `ActionSheet` | `<DuActionSheet>` | 见下方 |

```html
<!-- 列表模式 -->
<DuActionSheet
  v-model:open="showSheet"
  type="list"
  :items="[
    { label: '拍照', key: 'camera' },
    { label: '从相册选择', key: 'album' },
  ]"
  @select="handleSelect"
/>

<!-- 宫格模式（分享面板） -->
<DuActionSheet
  v-model:open="showShare"
  type="grid"
  :items="[
    { label: '微信', icon: 'wechat-colorful', key: 'wechat' },
    { label: '复制链接', icon: 'link', key: 'copy' },
  ]"
  @select="handleSelect"
/>
```

**DuActionSheet props**：
- `open`：boolean，v-model 双向绑定
- `type`：`'list'` | `'grid'`，列表或宫格，默认 `'list'`
- `items`：`{ key?: string; label: string; icon?: string; openType?: string }[]`

**事件**：`@select(item)` / `@update:open`

### Toast 轻提示

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Toast` | `<DuToastProvider>` + `useToast()` | 见下方 |

Toast 通过 Provider + inject 模式使用，不在模板中直接渲染：

```html
<!-- 在 App.vue 或页面根节点包裹 Provider -->
<DuToastProvider>
  <router-view />
</DuToastProvider>
```

```ts
// 在子组件中通过 inject 调用
import { inject } from 'vue'
import { toastInjectionKey } from 'your-ui-lib'

const toast = inject(toastInjectionKey)!
toast.show({ message: '操作成功' })
toast.show({ message: '加载中...', mask: true })
```

**ToastMessage**：
- `message`：string，提示文案
- `mask`：boolean，是否显示遮罩防止操作

### Snackbar 消息条

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Snackbar` | `<DuSnackbar>` | 见下方 |

```html
<!-- 基本用法 -->
<DuSnackbar :show="showSnackbar" @close="showSnackbar = false">
  操作成功
</DuSnackbar>

<!-- 带操作按钮 -->
<DuSnackbar
  :show="showSnackbar"
  :show-close="true"
  :show-action-btn="true"
  :button-props="{ text: '撤销', type: 'primary', color: 'white' }"
  @action="handleUndo"
  @close="showSnackbar = false"
>
  已删除 1 条记录
</DuSnackbar>

<!-- 带左侧图标 -->
<DuSnackbar :show="showSnackbar" left-icon="check-circle">
  保存成功
</DuSnackbar>

<!-- 固定位置（底部偏移） -->
<DuSnackbar :show="showSnackbar" :offset="50" offset-position="bottom">
  提示信息
</DuSnackbar>
```

**DuSnackbar props**：
- `show`：boolean，是否显示
- `showClose`：boolean，是否显示关闭按钮，默认 `false`
- `showActionBtn`：boolean，是否显示操作按钮，默认 `true`
- `buttonProps`：`{ text, color, type, size, arrowRight, extClass, extStyle }`
- `leftIcon`：左侧图标名
- `leftImage`：左侧图片 URL
- `offset`：偏移量（像素），默认 `0`
- `offsetPosition`：`'top'` | `'bottom'`，默认 `'bottom'`
- `duration`：自动关闭时间（秒），`0` 不自动关闭

**事件**：`@close` / `@action`

### 通知栏

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `NoticeBar` / `Notice` | `<DuNoticeBar>` | 见下方 |

```html
<!-- 基础通知 -->
<DuNoticeBar text="系统维护通知，请注意保存数据" />

<!-- 带链接 -->
<DuNoticeBar
  text="新版本已发布"
  link-text="立即更新"
  @link-click="handleUpdate"
/>

<!-- 可关闭 -->
<DuNoticeBar text="活动已开始" :closeable="true" @close="handleClose" />

<!-- 主色样式 -->
<DuNoticeBar type="primary" color="danger" text="警告信息" />

<!-- 垂直布局（文案和链接上下排列） -->
<DuNoticeBar
  layout="vertical"
  text="重要通知"
  link-text="查看详情"
  :closeable="true"
/>
```

**DuNoticeBar props**：
- `type`：`'primary'` | `'secondary'`，默认 `'secondary'`
- `color`：色板颜色名，默认 `'primary'`
- `text`：通知文案
- `linkText`：链接文案
- `linkIcon`：链接图标
- `closeable`：boolean，是否可关闭，默认 `false`
- `layout`：`'horizontal'` | `'vertical'`，默认 `'horizontal'`
- `ellipsis`：boolean，超长截断，默认 `false`
- `icon`：左侧图标

**事件**：`@close` / `@link-click`

### 空状态

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

### 卡片

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

### 骨架屏

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

### 复选框

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Checkbox` | `<DuCheckboxGroup>` + `<DuCheckbox>` | 见下方 |

```html
<!-- 基本用法：配合 CheckboxGroup -->
<DuCheckboxGroup v-model:value="selected">
  <DuCheckbox value="a" label="选项 A" />
  <DuCheckbox value="b" label="选项 B" />
  <DuCheckbox value="c" label="选项 C" />
</DuCheckboxGroup>

<!-- 行内排列 -->
<DuCheckboxGroup v-model:value="selected" inline>
  <DuCheckbox value="a" label="选项 A" />
  <DuCheckbox value="b" label="选项 B" />
</DuCheckboxGroup>

<!-- 卡片样式 -->
<DuCheckboxGroup v-model:value="selected" shape="card">
  <DuCheckbox value="a" label="卡片选项 A" />
  <DuCheckbox value="b" label="卡片选项 B" />
</DuCheckboxGroup>

<!-- 独立使用 -->
<DuCheckbox v-model:checked="agreed" label="我已阅读并同意" />
```

**DuCheckboxGroup props**：
- `value`：`string[]`，v-model 双向绑定
- `shape`：`'round'` | `'square'` | `'card'`
- `inline`：boolean，行内排列
- `position`：`'left'` | `'right'`，图标位置
- `color`：色板颜色名
- `custom`：boolean，自定义渲染

**DuCheckbox props**：
- `value`：string，配合 Group 使用的值
- `checked`：boolean，独立使用时的选中状态
- `label`：string，文字标签
- `shape` / `inline` / `position` / `color`：覆盖 Group 配置
- `disabled`：boolean
- `custom`：boolean，自定义渲染（slot）

### 单选框

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Radio` | `<DuRadioGroup>` + `<DuRadio>` | 见下方 |

```html
<!-- 基本用法 -->
<DuRadioGroup v-model:value="selected">
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>

<!-- 行内排列 -->
<DuRadioGroup v-model:value="selected" inline>
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>

<!-- 按钮样式 -->
<DuRadioGroup v-model:value="selected" shape="button" inline>
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>

<!-- Cell 模式（label 在左，图标在右） -->
<DuRadioGroup v-model:value="selected" cell>
  <DuRadio value="a" label="选项 A" />
  <DuRadio value="b" label="选项 B" />
</DuRadioGroup>
```

**DuRadioGroup props**：
- `value`：any，v-model 双向绑定
- `shape`：`'normal'` | `'button'`
- `inline`：boolean，行内排列
- `cell`：boolean，左右分布模式
- `custom`：boolean，自定义渲染
- `valueKey`：string，对象值比较 key
- `color`：色板颜色名

**DuRadio props**：
- `value`：any，当前项的值
- `checked`：boolean，独立使用
- `label`：string，文字标签
- `shape` / `inline` / `cell` / `color`：覆盖 Group 配置
- `disabled`：boolean
- `disabledTip`：string，禁用时 toast 提示
- `custom`：boolean

### 选择器

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Picker` / `Select` | `<DuPicker>` | 见下方 |

```html
<!-- 基本用法 -->
<DuPicker
  v-model:value="pickerValue"
  :columns="[
    [
      { label: '北京', value: 'beijing' },
      { label: '上海', value: 'shanghai' },
    ]
  ]"
  title="选择城市"
/>

<!-- 多列 -->
<DuPicker
  v-model:value="dateValue"
  :columns="[yearColumns, monthColumns, dayColumns]"
  title="选择日期"
/>

<!-- 在 FormItem 中使用（自动适配表单样式） -->
<FormItem label="城市">
  <DuPicker v-model:value="city" :columns="cityColumns" title="选择城市" />
</FormItem>

<!-- 自定义触发器 -->
<DuPicker v-model:value="val" :columns="columns" v-slot="{ open }">
  <Button @click="open">打开选择器</Button>
</DuPicker>
```

**DuPicker props**：
- `value`：`string[]`，v-model 双向绑定，每列一个值
- `columns`：`{ label: string; value: string }[][]`，选项列数据
- `title`：string，标题，默认 `'请选择'`
- `open`：boolean，控制显隐

**事件**：`@update:value` / `@update:open`

### PickerView 内联选择器

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `PickerView` | `<DuPickerView>` | 见下方 |

```html
<!-- 内联滚动选择（不带弹窗） -->
<DuPickerView
  v-model:value="pickerValue"
  :columns="[
    [
      { label: '00 时', value: '0' },
      { label: '01 时', value: '1' },
    ],
    [
      { label: '00 分', value: '0' },
      { label: '30 分', value: '30' },
    ],
  ]"
/>
```

**DuPickerView props**：
- `value`：`string[]`，v-model 双向绑定
- `columns`：`{ label: string; value: string }[][]`

### 级联选择

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Cascader` | `<DuCascader>` | 见下方 |

```html
<!-- 基本用法 -->
<DuCascader
  v-model:value="region"
  :options="regionOptions"
  title="选择地区"
/>

<!-- 带搜索 -->
<DuCascader
  v-model:value="region"
  :options="regionOptions"
  title="选择地区"
  show-search
  search-placeholder="搜索地区"
/>

<!-- 在 FormItem 中使用 -->
<FormItem label="地区">
  <DuCascader v-model:value="region" :options="regionOptions" title="选择地区" />
</FormItem>
```

**DuCascader props**：
- `value`：`string[]`，v-model 双向绑定，每级选中值
- `options`：`{ label: string; value: string; children?: CascaderOption[] }[]`
- `title`：string，默认 `'请选择'`
- `open`：boolean，控制显隐
- `showSearch`：boolean，是否显示搜索
- `searchPlaceholder`：string
- `popupStyle`：自定义弹窗样式

**事件**：`@update:value` / `@update:open` / `@confirm(options[])`
**插槽**：`default`（自定义触发器，`v-slot="{ open }"`）/ `option`（自定义选项渲染）

### 日历

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `Calendar` | `<DuCalendar>` | 见下方 |

```html
<!-- 单选日期 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="single"
  @confirm="handleDateConfirm"
/>

<!-- 多选日期 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="multiple"
  :selectable-count="7"
  @confirm="handleDatesConfirm"
/>

<!-- 范围选择 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="range"
  :selectable-count="30"
  @confirm="handleRangeConfirm"
/>

<!-- 带时间选择 -->
<DuCalendar
  v-model:visible="showCalendar"
  type="range"
  show-time-picker
  :time-step="5"
  @confirm="handleConfirm"
/>
```

**DuCalendar props**：
- `visible`：boolean，v-model 双向绑定
- `type`：`'single'` | `'multiple'` | `'range'`，默认 `'multiple'`
- `title`：string
- `confirmText`：string，确认按钮文案
- `selectedDate`：`dayjs.Dayjs | dayjs.Dayjs[]`，初始选中日期
- `min` / `max`：`dayjs.Dayjs | number`，可选范围
- `selectableCount`：number，最大可选天数，默认 `30`
- `weekStart`：number，周起始日（0=周日），默认 `0`
- `showTimePicker`：boolean，是否显示时间选择
- `timeStep`：`1` | `5` | `10`，时间步长，默认 `5`

**事件**：`@confirm({ value, date, dates })` / `@close` / `@clear`

### 数字输入

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `InputNumber` / `Stepper` | `<DuInputNumber>` | 见下方 |

```html
<!-- 基本用法 -->
<DuInputNumber v-model:value="count" :min="0" :max="99" />

<!-- 可直接输入 -->
<DuInputNumber v-model:value="count" :input="true" :min="1" :max="999" />

<!-- 紧凑模式（数量为 0 时只显示加号） -->
<DuInputNumber v-model:value="count" compact :min="0" :max="99" />

<!-- 强调加号按钮 -->
<DuInputNumber v-model:value="count" highlight-add color="primary" />

<!-- 不同尺寸 -->
<DuInputNumber v-model:value="count" size="small" />
```

**DuInputNumber props**：
- `value`：number，v-model 双向绑定
- `min`：number，默认 `0`
- `max`：number，默认 `Infinity`
- `step`：number，步长，默认 `1`
- `input`：boolean，允许直接输入，默认 `false`
- `size`：`'mini'` | `'small'` | `'normal'` | `'medium'` | `'large'`，默认 `'mini'`
- `color`：色板颜色名，默认 `'primary'`
- `highlightAdd` / `highlightMinus`：boolean，强调按钮
- `disabled`：boolean
- `allowDecimal`：boolean，允许小数
- `compact`：boolean，紧凑模式

**事件**：`@change(val)` / `@input(val)`

### 评分

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
- `clickable`：boolean，是否可点击，默认 `true`
- `icon`：图标名
- `half`：boolean，支持半选
- `animation`：`'bounce'` | `'fade'` | `null`
- `withText`：boolean，显示文字（仅 `size="large"` 生效）
- `textList`：`string[]`，每个星级对应的文字
- `defaultValue`：number，默认值

**事件**：`@change({ value })` / `@update:value`

### 下拉筛选

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

<!-- 隐藏底部按钮（选择即确认） -->
<DuDropdown
  v-model:visible="showFilter"
  v-model:value="filterValue"
  :options="filterOptions"
  :show-footer="false"
/>
```

```ts
// options 数据结构
const filterOptions: FilterField[] = [
  {
    label: '分类',
    value: 'category',
    options: [
      { label: '全部', value: 'all' },
      { label: '美食', value: 'food' },
    ],
  },
  {
    label: '筛选',
    value: 'filter',
    multiple: true,
    groups: [
      {
        label: '价格',
        value: 'price',
        options: [
          { label: '0-50', value: '0-50' },
          { label: '50-100', value: '50-100' },
        ],
      },
    ],
  },
]
```

**DuDropdown props**：
- `visible`：boolean，v-model 双向绑定
- `value`：`Record<string, any>`，v-model 选中值
- `options`：`FilterField[]`，筛选配置
- `layout`：`'tag'` | `'list'`，默认 `'tag'`
- `showFooter`：boolean，是否显示底部按钮，默认 `true`
- `cancelText` / `confirmText`

**事件**：`@confirm(value)` / `@update:value` / `@update:visible`
**插槽**：`option-nav`（自定义导航）/ `content`（自定义内容区）

### 吸顶

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
**方法**（ref）：`scrollToSticky()`

### 标签面板

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

```ts
const tags = ref([
  { text: '标签1', value: '1' },
  { text: '不可删除', value: '2', canRemove: false },
])
```

**DuTagsPanel props**：
- `tags`：`{ text: string; value: string | number; canRemove?: boolean }[]`
- `addText`：string，添加按钮文案，默认 `'添加'`
- `canToggle`：boolean，是否可折叠/展开
- `collapseCount`：number，超过多少个显示展开按钮，默认 `10`

**事件**：`@add` / `@remove({ value })`
**插槽**：`add`（自定义添加按钮）

### Tooltip 气泡提示

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

## UnoCSS 配置

<!--
⚠ 根据实际项目配置修改此部分
your-ui-lib 使用 unocss-preset-echo，间距单位需确认
-->

**间距单位**：1unit = 1px（请根据 uno.config.ts 确认）

换算示例（1unit = 1px 时）：
- 骨架 `gap-2`（标准 8px）→ 项目写 `gap-8`
- 骨架 `px-3.75`（15px）→ 项目写 `px-15`
- 骨架 `py-4`（16px）→ 项目写 `py-16`

---

## 设计 Token

<!--
⚠ 以下为参考值，根据实际项目的 uno.config.ts / theme.css 填写
-->

### 文字样式

| 骨架输出 | 项目 class |
|---|---|
| `text-[18px] font-medium` | `text-h3 fw-500` |
| `text-base font-medium` / `text-[16px] font-medium` | `text-h4 fw-500` |
| `text-base font-normal` / `text-[16px]` | `text-b4` |
| `text-sm font-normal` / `text-[14px]` | `text-b5` |
| `text-[12px]` | `text-b6` |

### 颜色 Token

| 骨架输出 | 项目 class |
|---|---|
| `text-[rgba(0,0,0,0.64)]` | `c-text-2` |
| `text-[rgba(0,0,0,0.4)]` / `text-[#999]` | `c-text-3` |
| `bg-[#F7F7F9]` / `bg-[#f5f5f5]` | `bg-page` |
| `text-black` / `text-[#000]` | `c-text-1` |

---

## 页面结构模板

```html
<template>
  <div class="flex flex-col min-h-screen bg-page">

    <!-- 内容卡片 -->
    <div class="bg-white px-15 py-16 mt-8">
      <div class="text-h4 fw-500 mb-16">标题</div>
      <!-- 内容 -->
    </div>

    <!-- 弹性占位 -->
    <div class="flex-1" />

    <!-- 底部按钮（若有） -->
    <div class="px-15 py-12 safe-area-bottom bg-white b-t-1 b-t-solid b-hex-E5E5E5">
      <Button color="primary" size="large" full @click="handleSubmit">
        提交
      </Button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// TODO: 按需补充
</script>
```

---

## 布局模式规则

### 横滑容器

骨架中 `overflow-x: auto` + 内部 `flex` 横向排列的结构，识别为横滑容器模式。

**识别特征**：
- 父容器 `overflow: hidden` 或 `overflow-x: auto`
- 内部子元素 `flex` 横排，子项有固定宽度 + `shrink-0`

**翻译规则**：

```html
<!-- 骨架示例 -->
<div class="overflow-x-auto">
  <div class="flex gap-12">
    <div class="w-[120px] shrink-0">卡片1</div>
    <div class="w-[120px] shrink-0">卡片2</div>
  </div>
</div>

<!-- 翻译为（小程序使用 scroll-view） -->
<scroll-view scroll-x class="w-full">
  <div class="flex gap-12 px-15">
    <div v-for="item in list" :key="item.id" class="w-120 shrink-0">
      <!-- 卡片内容 -->
    </div>
  </div>
</scroll-view>

<!-- H5 场景使用原生横滑 -->
<div class="overflow-x-auto scrollbar-hide">
  <div class="flex gap-12 px-15">
    <div v-for="item in list" :key="item.id" class="w-120 shrink-0">
      <!-- 卡片内容 -->
    </div>
  </div>
</div>
```

**要点**：
- 小程序用 `<scroll-view scroll-x>`，H5 用 `overflow-x-auto`
- 子卡片必须加 `shrink-0` 防止压缩
- 列表数据用 `v-for` 循环
- 首尾留白用 `px-15` 或在 flex 容器上加 padding

### 图片占位模式

骨架中 `:style="{ backgroundColor: 'url(figma-image:unknown)' }"` 表示图片占位，需根据场景翻译。

**场景一：独立图片（banner/头图）**

```html
<!-- 骨架 -->
<div class="w-full h-[200px]" :style="{ backgroundColor: 'url(figma-image:unknown)' }"></div>

<!-- 翻译 -->
<Image :src="bannerUrl" width="100%" height="200px" mode="aspectFill" />
```

**场景二：列表项图片（固定宽高）**

```html
<!-- 骨架 -->
<div class="w-[80px] h-[80px] rounded-8" :style="{ backgroundColor: 'url(figma-image:unknown)' }"></div>

<!-- 翻译 -->
<Image :src="item.cover" width="80px" height="80px" radius="8px" mode="aspectFill" />
```

**场景三：宽度自适应图片**

```html
<!-- 骨架 -->
<div class="w-full aspect-video" :style="{ backgroundColor: 'url(figma-image:unknown)' }"></div>

<!-- 翻译 -->
<Image :src="coverUrl" width="100%" mode="widthFix" />
```

**场景四：头像（圆形小图）**

```html
<!-- 骨架中圆形小图 -->
<div class="w-[40px] h-[40px] rounded-full" :style="{ backgroundColor: 'url(figma-image:unknown)' }"></div>

<!-- 翻译为 Avatar -->
<Avatar :src="user.avatar" size="normal" />
```

**mode 选择**：
- `aspectFill`：填充容器，可能裁剪（列表封面、卡片图片）
- `aspectFit`：完整显示，可能留白（详情大图）
- `widthFix`：宽度撑满，高度自适应（文章配图）

### 列表循环模式

骨架中出现多个**结构相同**的子项时，翻译为 `v-for` 循环。

**识别特征**：
- 连续多个相同结构的 div
- 子项结构完全一致（文字、图片位置相同）

**翻译规则**：

```html
<!-- 骨架（3 个重复卡片） -->
<div class="flex flex-col gap-12">
  <div class="flex gap-12 p-16 bg-white rounded-12">...</div>
  <div class="flex gap-12 p-16 bg-white rounded-12">...</div>
  <div class="flex gap-12 p-16 bg-white rounded-12">...</div>
</div>

<!-- 翻译 -->
<div class="flex flex-col gap-12">
  <div v-for="item in list" :key="item.id" class="flex gap-12 p-16 bg-white rounded-12">
    <!-- 提取一个子项的结构，变量替换为 item.xxx -->
  </div>
</div>
```

### Cell 列表模式

单行信息展示（label + value + 可选箭头），常用于设置页、个人中心、订单详情等场景。

**识别特征**：
- 横向 flex 布局，`justify-between`
- 左侧文字（label），右侧内容（value）+ 可选箭头图标
- 背景白色，有底部边框或分割线

**翻译规则**：

```html
<!-- 骨架 -->
<div class="flex justify-between items-center px-15 py-16 bg-white">
  <span>订单编号</span>
  <div class="flex items-center gap-4">
    <span class="c-text-2">20250416001</span>
    <Icon name="arrow-right" size="12px" />
  </div>
</div>

<!-- 翻译为（可点击行） -->
<div class="flex justify-between items-center px-15 py-16 bg-white" @click="handleCopy">
  <span>订单编号</span>
  <div class="flex items-center gap-4">
    <span class="c-text-2">{{ order.orderNo }}</span>
    <Icon name="arrow-right" size="12px" />
  </div>
</div>

<!-- 或使用 FormItem 实现（纯展示型） -->
<FormItem label="订单编号" showBorder>
  <span class="c-text-2">{{ order.orderNo }}</span>
</FormItem>
```

**要点**：
- 有箭头 → 可点击，加 `@click`
- 无箭头 → 纯展示，可用 `FormItem` 包装
- 连续多行可用 `v-for` + 配置数组

### 固定底部按钮

页面底部固定操作区（提交按钮、双按钮操作栏等）。

**识别特征**：
- 骨架中位于页面最底部的按钮区
- 通常有 safe-area padding
- 与页面内容分离，有上边框或阴影

**翻译规则**：

```html
<!-- 单按钮 -->
<div class="fixed bottom-0 left-0 right-0 px-15 py-12 bg-white safe-area-bottom b-t-1 b-t-solid b-hex-E5E5E5">
  <Button color="primary" size="large" full @click="handleSubmit">
    提交
  </Button>
</div>

<!-- 双按钮（取消 + 确认） -->
<div class="fixed bottom-0 left-0 right-0 flex gap-12 px-15 py-12 bg-white safe-area-bottom b-t-1 b-t-solid b-hex-E5E5E5">
  <Button type="outline" color="primary" size="large" class="flex-1" @click="handleCancel">
    取消
  </Button>
  <Button color="primary" size="large" class="flex-1" @click="handleConfirm">
    确认
  </Button>
</div>

<!-- 需要在页面内容区添加底部占位，防止内容被遮挡 -->
<div class="pb-[80px]">
  <!-- 页面内容 -->
</div>
```

**要点**：
- 必须加 `safe-area-bottom` 适配刘海屏
- 使用 `fixed` 定位，需在内容区加底部 padding 占位
- 双按钮用 `flex gap-12`，每个按钮 `flex-1` 等宽
- 上边框用 `b-t-1 b-t-solid b-hex-E5E5E5`

### 吸顶模式

页面滚动时固定在顶部的元素（标签页、筛选栏、搜索栏等）。

**识别特征**：
- 位于导航栏下方、内容区上方
- 通常是 Tabs、筛选条、搜索框
- 背景与页面区分（白色或带阴影）

**翻译规则**：

```html
<!-- 使用 Sticky 包裹 -->
<Sticky :top="44">
  <Tabs v-model:value="activeTab" color="primary">
    <Tab name="all">全部</Tab>
    <Tab name="pending">待处理</Tab>
    <Tab name="done">已完成</Tab>
  </Tabs>
</Sticky>

<!-- 筛选栏吸顶 -->
<Sticky :top="44">
  <div class="flex items-center gap-12 px-15 py-12 bg-white">
    <DuDropdown
      v-model:visible="filterOpen"
      v-model:value="filterValue"
      :options="filterOptions"
    />
    <DuSearch v-model:value="keyword" placeholder="搜索" />
  </div>
</Sticky>

<!-- 获取吸顶状态（用于样式变化） -->
<Sticky :top="44" v-slot="{ isSticky }">
  <div :class="['px-15 py-12 bg-white', isSticky && 'shadow-sm']">
    <!-- 吸顶时添加阴影 -->
  </div>
</Sticky>
```

**要点**：
- `top` 值通常为导航栏高度（44px）
- 小程序环境下 Sticky 使用 `position: sticky`
- 需要动态样式时用 `v-slot="{ isSticky }"`
- 吸顶内容建议加白色背景，防止与下方内容重叠

### 分组卡片模式

信息分组展示（订单详情、个人信息等），多个 Cell 组成一个卡片。

**识别特征**：
- 白色背景圆角卡片
- 内部多行 Cell 结构
- 行之间有分割线

**翻译规则**：

```html
<!-- 骨架 -->
<div class="bg-white rounded-12 mx-15 mt-12">
  <div class="flex justify-between px-15 py-16 b-b-1 b-b-solid b-hex-F0F0F0">...</div>
  <div class="flex justify-between px-15 py-16 b-b-1 b-b-solid b-hex-F0F0F0">...</div>
  <div class="flex justify-between px-15 py-16">...</div>
</div>

<!-- 翻译为（使用 Form 结构） -->
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

<!-- 或不用 Form，直接 v-for -->
<div class="bg-white rounded-12 mx-15 mt-12 overflow-hidden">
  <div
    v-for="(item, index) in infoList"
    :key="item.key"
    class="flex justify-between items-center px-15 py-16"
    :class="index < infoList.length - 1 && 'b-b-1 b-b-solid b-hex-F0F0F0'"
  >
    <span class="c-text-2">{{ item.label }}</span>
    <span>{{ item.value }}</span>
  </div>
</div>
```

**要点**：
- 卡片加 `overflow-hidden` 配合 `rounded-12` 裁剪子元素
- 最后一行不加底部边框
- 静态配置可用 `v-for` + 数组配置

---

## 生成规则

1. **宽度不写死**：容器统一用 `w-full`，只有图标、头像等固定尺寸元素保留 `w-[Npx]`
2. **颜色用 token**：优先用上方 token 表；找不到对应 token 时，用 UnoCSS hex 短语法替代（`text-[#f96464]` → `c-hex-f96464`，`bg-[#f96464]` → `bg-hex-f96464`，`border-[#f96464]` → `b-hex-f96464`），不要保留 `text-[#xxxxxx]` 写法
3. **动态内容**：静态文字改为 `{{ variable }}`，在 script 中声明对应 `ref`
4. **交互占位**：所有 `@click`、`@change` 加 `// TODO: 实现` 注释的方法
5. **图标名称**：从骨架 INSTANCE 名中提取，转为 kebab-case（`IconArrowRight` → `arrow-right`）
6. **extClass**：需要额外样式时用 `extClass` prop 而不是直接加 class
7. **单输入框禁止套 Form**：只有单个输入框或无 label 的输入框直接用 `DuInput`，不要包裹 `Form`
8. **Form 无 border prop**：行间分割线通过 `FormItem` 的 `showBorder` 控制，不要在 `Form` 上加 `border`
