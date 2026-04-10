# collect-patterns

从实际开发代码中采集组件写法和代码风格，生成可合并到 figma-to-code 模板的结构化输出。

## 输入方式

两种方式任选其一：

1. **指定模块目录**：`/collect-patterns lib/Modules/xxx/`
2. **指定 git 变更**：
   - `/collect-patterns --branch=feature/xxx`
   - `/collect-patterns --commit=abc123`
   - `/collect-patterns --mr=456`

---

## 步骤

**第一步：确定分析范围**

- 目录模式 → 读取该目录下所有 `.dart` 文件
- git 模式 → 通过 `git diff` 提取变更文件列表（只分析 `.dart` 文件）

```bash
# 目录模式
find <path> -name "*.dart" -type f

# branch 模式
git diff --name-only main...<branch> -- '*.dart'

# commit 模式
git diff --name-only <commit>~1..<commit> -- '*.dart'
```

**第二步：读取所有目标文件**

逐个读取 `.dart` 文件内容。如果文件数量过多（>20），优先选取：
1. `page/` 目录下的文件（页面入口）
2. `view/` 目录下的文件（UI 组件）
3. `view_model/` 目录下的文件（业务逻辑）
4. `model/` 目录下的文件（数据模型）

**第三步：逐维度分析提取**

读取 `.claude/figma-context.md` 获取当前已有的组件映射表，然后分析代码，提取以下 5 个维度：

### 维度 1：组件用法

扫描所有 `Echo*`、`Custom*`、`Dumpling*` 前缀的组件使用，记录：
- 组件名
- 传递的参数和典型值
- 组件组合方式（如 EchoAppBar + EchoAppBarCenterText）

**重点关注**：
- 不在当前 figma-context.md 映射表中的**新组件**
- 已有组件的**新用法**（新参数、新 style 变体）

### 维度 2：布局模式

分析页面和组件中的布局选择：
- 页面级滚动：SingleChildScrollView / CustomScrollView / NestedScrollView
- 列表实现：继承 CustomBaseListPage 还是手写 ListView
- Flex 布局习惯：Row/Column 的 mainAxisAlignment/crossAxisAlignment 常用组合
- Stack 使用场景

### 维度 3：样式用法

提取实际的样式调用方式：
- 颜色：`AppColor.qd.xxx` 还是 `context.appTheme.qd.xxx`，哪些颜色 token 被使用
- 文本样式：`CustomTextStyles.generateStyle()` 的 typography 和 color 组合
- 间距：`AppSpacing` 的使用方式
- 是否有违反规范的用法（AppColors、TextStyles 等已废弃 API）

### 维度 4：MVVM 结构

分析页面的 MVVM 实现模式：
- 继承哪个基类（CustomBasePage / CustomBaseListPage / CustomBaseGridPage）
- ViewModel 的 loadPageData 实现方式
- ObserverData / ObserverWidget 的使用方式
- readParentData / watchParentData 跨页面数据共享
- 骨架屏实现（skeletonWidget 重写方式）

### 维度 5：代码风格

观察代码的风格特征：
- import 组织方式（分组顺序）
- 命名习惯（变量、方法、文件名）
- 注释风格（中文/英文、位置）
- 错误处理模式
- 异步调用模式（immediateLaunch 等）

**第四步：生成结构化输出**

将分析结果整理为两部分输出：

---

### 输出 Part 1：figma-context-kuril.md 更新建议

格式为可直接合并的 markdown 片段：

```markdown
## 采集更新 — [模块名/分支名] （[日期]）

### 新增组件映射
| Figma 组件名 | 项目组件 | 文件路径 | 备注 |
|---|---|---|---|
| ... | ... | ... | 采集发现 |

### 组件用法补充

#### [组件名]
| 变体 | 典型用法 |
|---|---|
| ... | `代码片段` |

### 样式 Token 补充
| 骨架输出 | 项目 Token | 使用场景 |
|---|---|---|
| ... | ... | ... |
```

### 输出 Part 2：figma-flutter.md 翻译规则补充

```markdown
## 采集补充的翻译规则 — [模块名/分支名]

- 规则 1：...
- 规则 2：...
```

---

**第五步：确认并指引合并**

展示采集结果后，告知用户：

> 采集完成。请将上述内容合并到 figma-to-code 项目：
> 1. Part 1 → 更新 `template/figma-context-kuril.md` 对应章节
> 2. Part 2 → 更新 `.claude/commands/figma-flutter.md` 翻译规则
> 3. 发布新版本后，所有 Flutter 开发者 `--upgrade` 即可获得更新

## 注意事项

- 只提取**通用模式**，不提取业务特定逻辑
- 不提取敏感信息（API key、token、密码等）
- 违反项目规范的代码（如使用已废弃 API）标记为警告，不纳入推荐模式
- 如果发现项目规范有更新（如新组件替代旧组件），明确标注
