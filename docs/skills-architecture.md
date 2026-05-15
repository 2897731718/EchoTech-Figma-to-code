# CustomUI Skills 架构说明

## 文件结构

```
template/
├── commands/figma.md              # /figma skill 主流程定义
├── figma-context-your-ui-lib.md       # 项目级配置模板（业务组件映射、UnoCSS、Token）
└── figma-base-your-ui-lib/
    ├── index.json                 # 组件注册表 + aliases 映射
    ├── core.md                    # 核心翻译原则（禁止行为、通用规则）
    ├── layout.md                  # 布局模式（横滑、列表、吸顶、固定底部等）
    └── components/
        ├── navigation.md          # DuNavigationBar, DuSearch 用法
        ├── button.md              # Button 用法
        ├── form.md                # Form, FormItem 用法
        ├── input.md               # DuInput, DuTextarea 用法
        └── ...                    # 其他组件规则
```

---

## 各文件作用

| 文件 | 作用 | 加载时机 |
|------|------|----------|
| `index.json` | 组件注册表：`components`（组件→规则文件）、`aliases`（Figma名→Du组件名） | 每次翻译 |
| `core.md` | 核心原则：1:1 还原、禁止省略、组件引入方式、单位/颜色规则 | 每次翻译 |
| `layout.md` | 布局模式识别：横滑容器、列表循环、固定底部、吸顶等 | 每次翻译 |
| `components/*.md` | 单个组件的详细用法、props、slots、示例代码 | **按需加载** |
| `figma-context.md` | 项目定制：业务组件映射表、UnoCSS 配置、Token 映射 | 每次翻译 |

---

## 翻译流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 第一步：生成骨架                                                  │
│ npx figma-to-code $URL --framework=vue --tokens=product-a         │
│                                                                 │
│ 输出：                                                           │
│ <NavigationBar class="...">                                     │
│   <SearchBar />  <!-- figma-node: xxx -->                       │
│ </NavigationBar>                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第二步：加载规则                                                  │
│                                                                 │
│ ① 读取 index.json 的 aliases：                                   │
│    NavigationBar → DuNavigationBar                              │
│    SearchBar → DuSearch                                         │
│                                                                 │
│ ② 根据映射后的组件名，查 components 字段找规则文件：                  │
│    DuNavigationBar → navigation.md                              │
│    DuSearch → navigation.md                                     │
│                                                                 │
│ ③ 加载文件：                                                      │
│    - core.md（必加载）                                            │
│    - layout.md（必加载）                                          │
│    - components/navigation.md（按需）                             │
│    - figma-context.md（项目配置）                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第三步：翻译                                                      │
│                                                                 │
│ ① 组件名转换（按 aliases）：                                       │
│    <NavigationBar> → <DuNavigationBar>                          │
│    <SearchBar> → <DuSearch>                                     │
│                                                                 │
│ ② 参照 navigation.md 生成正确用法：                                │
│    <DuNavigationBar>                                            │
│      <DuSearch placeholder="搜索" readonly />                   │
│    </DuNavigationBar>                                           │
│                                                                 │
│ ③ 样式转换（按 core.md）：                                         │
│    gap-[8px] → gap-8px                                          │
│    text-[#fff] → c-white                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第四步：输出                                                      │
│                                                                 │
│ <template>                                                      │
│   <DuNavigationBar>                                             │
│     <DuSearch placeholder="搜索" readonly @click="goSearch" />  │
│   </DuNavigationBar>                                            │
│ </template>                                                     │
│                                                                 │
│ <script setup lang="ts">                                        │
│ import { DuNavigationBar, DuSearch } from 'your-ui-lib'             │
│ const goSearch = () => { /* TODO */ }                           │
│ </script>                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## index.json 结构详解

```json
{
  "version": "0.7.0",
  "uiLib": "your-ui-lib",
  "prefix": "Du",
  
  // 组件 → 规则文件映射（按需加载的依据）
  "components": {
    "DuNavigationBar": "navigation.md",
    "DuSearch": "navigation.md",
    "Button": "button.md"
  },
  
  // Figma 组件名 → your-ui-lib 组件名（翻译时转换的依据）
  "aliases": {
    "NavigationBar": "DuNavigationBar",
    "NavBar": "DuNavigationBar",
    "SearchBar": "DuSearch",
    "Search": "DuSearch",
    "Button": "Button"
  }
}
```

---

## 按需加载的好处

假设骨架只用到 `NavigationBar` 和 `Button`：

- **只加载**：`core.md` + `layout.md` + `navigation.md` + `button.md`
- **不加载**：`form.md`、`picker.md`、`dialog.md` 等 15+ 个文件

减少 AI 上下文占用，提高翻译准确性。

---

## 组件规则文件格式

以 `navigation.md` 为例：

```markdown
# 导航栏

## DuNavigationBar

| Figma 节点名含 | 组件 | 用法 |
|---|---|---|
| `NavigationBar` / `NavBar` | `<DuNavigationBar>` | 见下方 |

<!-- 基础用法示例 -->
<DuNavigationBar>标题</DuNavigationBar>

<!-- 带搜索框 -->
<DuNavigationBar>
  <DuSearch placeholder="搜索" readonly />
</DuNavigationBar>

**Props**：
- `color`：色板颜色名
- `back`：boolean，显示返回按钮
- `share`：boolean，显示分享按钮
...

**Slots**：`left`、`default`、`right`

**模式识别**：
- 导航栏内含 Search 子节点 → 在 #default slot 中放 DuSearch
- 导航栏内含 Tabs → 加 center 属性
```

---

## 扩展新组件

1. **添加组件规则**：在 `components/` 下新建 `xxx.md`
2. **注册组件**：在 `index.json` 的 `components` 中添加映射
3. **添加别名**：在 `index.json` 的 `aliases` 中添加 Figma 名到组件名的映射

```json
{
  "components": {
    "DuNewComponent": "new-component.md"
  },
  "aliases": {
    "NewComponent": "DuNewComponent",
    "NewComp": "DuNewComponent"
  }
}
```
