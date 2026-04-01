# figma-to-code

从 Figma 链接到可用组件代码的自动化工具。

核心思路：**不直接生成业务代码，而是提取结构骨架，再由 IDE AI 结合项目规范翻译为最终代码。遇到未知子组件时自动递归生成。**

```
Figma 链接
    ↓
figma-to-code（提取骨架，INSTANCE 节点附带 figma-node 注释）
    ↓
IDE AI + figma-context.md（翻译为业务代码）
    ├── 命中已知基础组件（Button 等）→ 直接使用
    ├── 命中已生成业务组件 → import 后使用
    └── 未匹配 → 用 figma-node id 自动拉取子组件骨架，递归生成 .vue 文件
    ↓
可用的 Vue / React 组件（含完整子组件树）
```

---

## 安装

```bash
pnpm add -g figma-to-code   # 全局安装，推荐
# 或
pnpm add figma-to-code      # 项目内安装
```

---

## 快速上手

### 第一步：配置 Figma PAT

#### 获取 Token

~~1. 打开 Figma，点击右上角头像 → **Settings**
2. 左侧菜单选 **Security**
3. 找到 **Personal access tokens** → 点击 **Generate new token**
4. 填写名称，权限选 **Read-only**，生成后复制 token（只显示一次）~~

1. Figma 左上角figma logo
2. help and acount -> account settings -> security  往底下滑动Personal access tokens -> generate new token


#### 存储 Token

**推荐：macOS Keychain（一次配置，所有项目共用）**

```bash
security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "你的TOKEN"

# 验证是否存储成功
security find-generic-password -s FIGMA_PAT_GLOBAL -w
```

**或：项目级 `.env.local`（记得加入 `.gitignore`）**

```bash
FIGMA_PAT=你的TOKEN
```

> **注意**：Token 由 CLI 自动读取，无需手动传入，也不需要在 IDE AI 对话中提供。

### 第二步：初始化项目

在需要使用的业务项目目录下运行：

```bash
# 通用模板
npx figma-to-code init

# 指定组件库（目前支持 your-ui-lib）
npx figma-to-code init --ui=your-ui-lib
```

执行后会在项目中创建：

```
.claude/
├── commands/
│   └── figma.md          # AI 调用的 skill（无需修改）
└── figma-context.md      # 项目规范（可自行修改维护）
```

若已有对应文件，不会覆盖，需要重新初始化请先删除对应 figma-context.md

### 第三步：填写项目规范

编辑 `.claude/figma-context.md`，填写你的项目信息：

- 组件库名称和前缀
- 常用组件的用法示例
- UnoCSS 间距单位配置
- 设计 Token 映射（颜色、字体）

> 每个项目只需填写一次，后续持续维护即可。

### 第四步：使用

在 IDE（Cursor / Claude Code 等）的聊天窗口中直接对话：

```
/figma https://www.figma.com/design/xxx/...?node-id=123-456

# 或指定输出路径
/figma https://www.figma.com/design/xxx/...?node-id=123-456 src/views/MyPage.vue
```

AI 会自动：
1. 调用 CLI 提取 Figma 骨架（INSTANCE 节点标注 `<!-- figma-node: xxx -->`）
2. 读取 `.claude/figma-context.md` 中的项目规范和业务组件映射表
3. 翻译主骨架为业务代码
4. 遇到未匹配的 INSTANCE → 用 `figma-node` id 递归拉取子组件骨架 → 生成子组件文件 → 更新映射表
5. 输出完整组件树

---

## i18n 支持

figma-to-code 可自动识别绑定了 Figma Variables 的 i18n 文本，输出 `{{ t('key') }}` 而非静态文字。

### 前提条件

设计团队使用 [Export/Import Variables](https://www.figma.com/community/plugin/1256972111705530093) 插件将 i18n key 导入 Figma 作为 Variables。

### 配置步骤

**1. 安装 Figma 插件（一次性）**

在 Figma 桌面端：右键画布 → Plugins → Development → Import plugin from manifest... → 选择本项目的 `figma-plugin/manifest.json`。

**2. 运行插件导出映射（每个文件跑一次）**

1. 在设计稿中选中需要提取的 Frame
2. 右键 → Plugins → Development → **i18n Variable Exporter**
3. 底部通知显示找到的变量数量，映射自动存入文件

> 插件采用增量合并，多次运行不会覆盖。变量变更后重新运行即可。

**3. 正常使用 figma-to-code**

无需额外参数，工具会自动读取映射并输出 i18n key：

```html
<!-- 没有 i18n 绑定 -->
<span>3344</span>

<!-- 有 i18n 绑定，自动输出 -->
<span>{{ t('09_Product.Sold') }}</span>
<span>{{ t('09_Product.LatestListings') }}</span>
```

### 工作原理

```
Figma 插件                              figma-to-code
┌──────────────────────┐              ┌─────────────────────────────┐
│ 扫描 TEXT 节点        │              │ REST API + plugin_data=shared│
│ getVariableById()    │ ──存入文件──→ │ 读取 sharedPluginData        │
│ 写入 sharedPluginData │              │ VariableID → 变量名 → i18n key│
└──────────────────────┘              └─────────────────────────────┘
```

Variable name `09_Product/成交(Sold)` 解析为 i18n key `09_Product.Sold`（取每段路径括号内的英文，用 `.` 连接）。

详细技术方案见 [ARCHITECTURE.md](./ARCHITECTURE.md#i18n-变量支持)。

---

## 生成效果对比

**Figma 骨架（中间产物，不直接使用）：**

```html
<div class="flex flex-row gap-[16px] items-center">
  <span class="text-[#000000] text-[16px] font-[400]">年份</span>
  <div class="flex flex-row gap-[4px] items-center">
    <span class="text-[rgba(0,0,0,0.64)] text-[16px]">2025</span>
    <IconArrowHeavyRight class="w-[12px] h-[12px]" />
  </div>
</div>
```

**AI 翻译后的业务代码：**

```html
<div class="flex items-center justify-between" @click="yearPickerOpen = true">
  <span class="text-b4">年份</span>
  <span class="text-b4 c-text-2 flex items-center gap-4">
    {{ yearLabel }}
    <Icon name="arrow-right" :size="12" />
  </span>
</div>
```

---

## Skill 文件说明

### 文件结构

```
.claude/
├── commands/
│   └── figma.md          # 标准 skill，所有项目通用，无需修改
└── figma-context.md      # 项目级规范，每个项目单独维护
```

### figma.md（通用，无需改动）

告诉 AI 如何执行生成流程：调用 CLI → 读取规范 → 翻译代码。

升级 figma-to-code 后重新执行 `npx figma-to-code init` 可获取最新版本（已存在时不覆盖）。

### figma-context.md（项目级，重点维护）

这是整个流程的核心配置，决定生成质量。包含：

| 配置项 | 说明 |
|---|---|
| 组件库 | 前缀、包名、常用组件的典型用法 |
| **业务组件映射** | Figma 组件名 → 项目组件 / 文件路径，驱动递归生成决策 |
| 组件映射规则 | Figma 节点名关键词 → 具体组件标签 |
| UnoCSS 配置 | 间距单位（1unit = 1px 还是 4px）|
| 设计 Token | 颜色、字体的 token 映射 |
| 页面结构模板 | 标准页面外层结构 |
| 生成规则 | 宽度处理、图标命名、动态绑定等约定 |

**业务组件映射表维护说明：**

每次递归生成新的子组件文件后，需在表格中补充一行，例如：

```markdown
| ProductCard | `ProductCard` | @/components/ProductCard.vue | 已生成 |
```

后续主组件翻译时识别到同名 INSTANCE，直接 import 该路径，不再重复生成。

---

## 扩展 Skill

### 为新项目添加规范

直接编辑 `.claude/figma-context.md`，按已有格式增加内容即可。修改后立即生效，无需重启。

### 支持新的组件库

在 figma-to-code 的 `template/` 目录中新建模板文件：

```bash
template/
├── figma-context.md              # 通用模板
├── figma-context-your-ui-lib.md      # CustomUI 模板
└── figma-context-vant.md         # 你的新模板
```

模板格式参考 `template/figma-context.md`，重点填写：
1. 组件映射表（Figma 节点名 → 组件标签 + 用法）
2. UnoCSS 单位说明
3. Token 映射

添加后通过以下命令初始化：

```bash
figma-to-code init --ui=vant
```

### 扩展生成规则

如果需要定制 AI 的生成行为（比如特定的命名约定、特殊的布局处理），在 `.claude/figma-context.md` 最后的「生成规则」部分追加说明：

```markdown
## 生成规则

- 列表页统一用 `<DuList>` 包裹，不用原生 `ul/li`
- 所有弹窗组件加 `v-model:visible`，初始值为 `false`
- 颜色值优先用项目 token，找不到对应 token 时保留原始 hex 并加 `<!-- TODO: token -->` 注释
```

### 添加更多 Skill

可以在 `.claude/commands/` 下创建更多专用 skill：

```
.claude/commands/
├── figma.md              # Figma 链接 → 组件代码
├── figma-list.md         # 专门处理列表页面
└── figma-form.md         # 专门处理表单页面
```

示例：`figma-form.md` 可以在通用流程基础上，额外处理表单校验规则、提交逻辑模板等。

---

## CLI 参考

```bash
# 初始化项目 skill 文件
figma-to-code init
figma-to-code init --ui=your-ui-lib

# 生成骨架（输出到 stdout）
figma-to-code <figma-url>
figma-to-code <figma-url> --framework=vue --style=unocss

# 选项
--framework=vue|html|react   输出框架，默认 vue
--style=unocss|css|inline    样式格式，默认 unocss
```

---

## PAT 配置详情

PAT 读取优先级（从高到低）：

1. **项目 `.env.local`**（仅当前项目）
   ```bash
   FIGMA_PAT=your-token-here
   ```

2. **macOS Keychain**（推荐，跨项目共用）
   ```bash
   # 存储
   security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "your-token"
   # 支持的 service 名：FIGMA_PAT_GLOBAL、FIGMA_PAT
   ```

3. **环境变量**
   ```bash
   export FIGMA_PAT=your-token-here
   ```

---

## 本地开发

```bash
# 克隆并安装依赖
pnpm install

# 构建
pnpm build

# 全局链接（在其他项目中使用本地版本）
pnpm link --global

# 运行测试（需配置 PAT）
pnpm test:run

# 集成测试（需提供真实 Figma 链接）
FIGMA_URL="https://www.figma.com/design/xxx/..." pnpm test:run tests/integration.test.ts
```

---

## License

MIT
