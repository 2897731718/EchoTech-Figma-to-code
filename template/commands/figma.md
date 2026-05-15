---
description: 根据 Figma 链接生成 Vue 组件
argument-hint: "<figma-url> [output-path]"
arguments: [url, path]
disable-model-invocation: true
allowed-tools: Bash(npx figma-to-code *) Read
---

# figma

将 Figma 设计稿转换为项目可用的 Vue 组件。

## 原则

1. **直接执行 CLI** — Token 由内部处理，无需预检查
2. **未识别组件列出后等待确认** — 用户选择生成或跳过
3. **翻译完成先暂存** — 用户确认后再写入文件

---

## 流程

### 1. 生成骨架

```bash
npx figma-to-code $url --framework=vue --tokens=product-a
```

- 首次使用时询问用户选择 token（Product A/Product B/Product C/Product D）
- 报错则停止，成功则继续

### 2. 读取规范

检查 `.claude/figma-context.md`，不存在则提示运行 `figma-to-code init`。

**按需加载**（存在 `.claude/figma-base/` 时）：
1. 读取 `figma-context.md` — 业务组件映射表
2. 读取 `figma-base/index.json` — 获取 aliases 映射
3. 解析骨架，提取组件标签
4. 用 aliases 映射组件名（如 `NavigationBar` → `DuNavigationBar`）
5. 只读取用到的组件规则（`components/*.md`）
6. 读取 `core.md`、`layout.md`

### 3. 翻译骨架

**组件映射**（按优先级）：

| 匹配 | 处理 |
|------|------|
| 命中 aliases | 转为 UI 库组件，按组件规则生成代码 |
| 命中业务映射表 | import 已生成的组件 |
| 未命中 | 标记为「未识别」，进入步骤 4 |

**样式转换**：按 `core.md` 和 `layout.md` 规则处理。

**自检**（输出前核对）：
- [ ] 骨架中的每个组件都有对应输出
- [ ] 数值、尺寸、颜色保持原样
- [ ] 未做任何"优化"或"简化"

**大骨架处理**：按模块分块，每块翻译完成后让用户确认再继续。

### 4. 询问未识别组件

收集所有带 `<!-- figma-node: xxx -->` 且未命中映射的组件，一次性询问：

> 发现以下未识别组件（已去重）：
> 
> | 组件名 | 出现次数 | figma-node |
> |--------|----------|------------|
> | IslandsPinBasic | 6 | 14210:714409 |
> | FeedPost | 7 | 18215:29049 |
> 
> 请选择：
> 1. 哪些需要生成？
> 2. 保存路径格式？（如 `src/components/{name}.vue`）
> 3. 或输入「全部跳过」

### 5. 递归生成

用户选择生成的组件：

1. **批量获取骨架**：对每个组件执行 CLI
   ```bash
   npx figma-to-code <原始url>&node-id=<figma-node> --framework=vue --tokens=<同上>
   ```

2. **汇总新发现的未识别组件**：解析所有骨架，收集未命中映射的子组件（去重）

3. **一次性询问**：如有新的未识别组件，重复步骤 4 的询问流程

4. **按依赖顺序生成**：被依赖的组件先生成（叶子节点优先）

5. **相对路径 import**：同目录组件用 `import X from './X.vue'`

### 6. 写入文件

用户确认后：

1. 按依赖顺序写入所有组件文件
2. 更新 `figma-context.md` 业务组件映射表
3. 输出完成摘要（已生成的文件列表）

---

## 告警

翻译过程中遇到以下情况时输出告警：

| 情况 | 告警 |
|------|------|
| UI 库组件属性不完全匹配 | 列出未匹配属性，提示检查 |
| 未识别组件 | 提示可能需要更新组件库或递归生成 |
