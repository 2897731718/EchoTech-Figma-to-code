# Architecture

figma-to-code 的核心流程是：

```text
Figma URL
  -> URL 解析与 PAT 读取
  -> Figma REST API
  -> 节点简化与实例折叠
  -> 统一 DesignNode
  -> 布局 / 样式 / token 解析
  -> Vue / React / HTML 生成器
  -> Agent 结合项目规则完成实现
```

## 模块边界

- `src/api/`：Figma REST API 客户端和类型。
- `src/extractor/`：把原始 Figma 节点简化为生成阶段需要的数据。
- `src/converter/`：构建统一节点树、解析布局与样式、选择生成器。
- `src/converter/generators/`：Vue、React 和 HTML 输出。
- `src/token-loader.ts`：加载可选的 token 映射。
- `bin/cli.ts`：命令行参数、初始化模板、输出和更新提示。
- `template/`：Agent、基础规则和通用 UI 示例。

## 关键设计

### 统一中间结构

API 原始响应不会直接进入模板生成器。提取层先删除无关字段、规范化节点类型，并建立 `DesignNode`。这样布局修复和生成器能够共享同一套语义。

### 布局优先

生成器优先保留 Auto Layout、Grid、间距、尺寸约束和绝对定位信息。视觉细节仍需要结合项目样式系统校准，但页面骨架应首先保持结构正确。

### 实例折叠

组件实例可以折叠为语义节点，同时保留文本覆盖、嵌套实例和图标信息。折叠前缀可通过 CLI 调整，以便适配不同设计系统。

### 规则分层

Agent 规则分为基础规则、组件规则和业务规则。CLI 只负责产生稳定骨架；最终组件选择、路由、状态和交互由 Agent 根据目标代码库完成。

## 安全边界

- Figma PAT 只从环境变量或本地环境文件读取。
- 日志和错误信息不得输出 Token。
- 公开仓库不携带真实业务设计稿 URL、私有 Registry 或内部组件映射。
- 可选的组件注释映射只能通过使用者显式配置的 URL 加载。

## 验证

每次发布前至少运行：

```bash
pnpm typecheck
pnpm test:run
pnpm build
```

集成测试需要显式设置 `FIGMA_PAT` 和 `FIGMA_URL`，默认不会访问网络。
