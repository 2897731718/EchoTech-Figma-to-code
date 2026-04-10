# collect-patterns

从项目实际代码中采集组件写法和代码风格，**直接更新** `.claude/figma-context.md`。

## 输入方式

```bash
# 扫描整个项目（新项目初始化推荐）
/collect-patterns lib/

# 指定模块目录（功能完成后采集）
/collect-patterns lib/Modules/xxx/

# 指定 git 变更
/collect-patterns --branch=feature/xxx
/collect-patterns --commit=abc123
```

---

## 步骤

**第一步：确定分析范围**

- 路径模式 → 读取该目录下所有 `.dart` 文件
- git 模式 → 通过 `git diff` 提取变更文件列表（只分析 `.dart` 文件）

```bash
# 路径模式
find <path> -name "*.dart" -type f

# branch 模式
git diff --name-only main...<branch> -- '*.dart'

# commit 模式
git diff --name-only <commit>~1..<commit> -- '*.dart'
```

如果文件数量过多（>30），优先选取：
1. `page/` 或 `pages/` 目录（页面入口）
2. `view/` 或 `widgets/` 目录（UI 组件）
3. `view_model/` 或 `view_models/` 目录（业务逻辑）
4. `Common/Utility/CommonWidgets/` 目录（通用组件）

**第二步：读取当前 figma-context.md**

读取 `.claude/figma-context.md`，理解当前已有的：
- 组件映射表（哪些组件已记录）
- 组件用法示例（哪些用法已记录）
- 颜色/文本/间距 Token

**第三步：逐维度分析代码**

### 维度 1：组件用法

扫描所有 `Echo*`、`Custom*`、`Dumpling*`、`QD*` 前缀的组件使用，记录：
- 组件名 + 传递的参数和典型值
- 组件组合方式（如 EchoAppBar + EchoAppBarCenterText）

**重点关注**：
- 不在当前映射表中的**新组件**
- 已有组件的**新用法**（新参数、新变体）

### 维度 2：布局模式

- 页面级滚动选择（SingleChildScrollView / CustomScrollView / NestedScrollView）
- 列表实现（CustomBaseListPage / 手写 ListView）
- Stack / Row / Column 的常用组合

### 维度 3：样式用法

- 颜色：哪些 `context.appTheme.qd.xxx` / `AppColor.qd.xxx` 被使用
- 文本：`CustomTextStyles.generateStyle()` 的 typography + color 组合
- 间距：`AppSpacing` 的使用方式
- 违反规范的用法（AppColors、TextStyles 等已废弃 API）→ 标记警告

### 维度 4：MVVM 结构

- 继承哪个基类
- ViewModel 的 loadPageData / obtainResponse 模式
- ObserverData / ObserverWidget 用法
- 骨架屏实现方式

### 维度 5：代码风格

- import 组织、命名习惯、注释风格
- 异步调用模式（immediateLaunch 等）

**第四步：直接更新 figma-context.md**

读取当前 `.claude/figma-context.md`，按以下规则更新：

### 更新规则

1. **业务组件映射表**：
   - 发现新组件 → 追加新行到映射表
   - 已有组件 → 不重复添加

2. **组件用法章节**：
   - 发现新的组件用法 → 补充到对应组件的用法示例中
   - 发现新的组件类别（如当前没有 Dialog 章节但代码中用了）→ 新增章节

3. **颜色/文本 Token**：
   - 发现新的 Token 用法 → 补充到对应表格
   - 发现废弃 API 用法 → 在注意事项中标记警告

4. **布局和 MVVM 章节**：
   - 发现新的模式 → 补充到对应章节
   - 与现有描述矛盾的 → 以实际代码为准更新

5. **不改动的内容**：
   - 现有的基础规范描述（颜色系统说明、Typography 枚举等）
   - 用户手动写的注释和说明

**第五步：展示变更摘要**

更新完成后，向用户展示：

```
采集完成，已更新 .claude/figma-context.md：

新增组件：
  + EchoSearchBarButton — 搜索栏按钮
  + CardRotation360Widget — 3D 卡片旋转

补充用法：
  ~ Button — 新增 danger 样式变体
  ~ EchoDialog — 补充 withMultipleButtons 用法

新增 Token：
  + context.appTheme.qd.trade_textColor — 交易文字色

警告：
  ⚠ 发现 3 处 AppColors 使用（已废弃）
  ⚠ 发现 1 处 TextStyles 使用（已废弃）
```

## 典型场景

### 场景 1：新项目初始化

Product C项目刚 init，figma-context.md 是通用的 Echo Flutter 模板。运行：

```
/collect-patterns lib/
```

扫描整个项目，自动补充：
- 项目实际用了哪些 Echo/Custom 组件及其参数
- 项目实际用了哪些颜色 Token
- 项目的 MVVM 基类选择和页面结构偏好
- 项目特有的编码风格

### 场景 2：功能完成后采集

完成了货架发布功能，想沉淀组件写法：

```
/collect-patterns lib/Modules/shelf_publish/
```

### 场景 3：采集某次 MR 的变更

```
/collect-patterns --branch=feat/shelf-publish
```

## 注意事项

- 只提取**通用模式**，不提取业务特定逻辑
- 不提取敏感信息（API key、token、密码等）
- 违反项目规范的代码标记为警告，不纳入推荐模式
- 更新前会展示变更摘要，用户确认后写入
