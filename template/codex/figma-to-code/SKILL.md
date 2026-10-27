---
name: figma-to-code
description: 根据 Figma 链接提取 Vue、React 或 HTML 骨架，并结合当前代码库完成页面实现。用户要求还原 Figma 设计、从设计稿生成前端代码或使用 figma-to-code 时使用。
---

# Figma to Code

## 工作流

1. 阅读目标项目的组件、样式、路由和相邻页面，沿用现有模式。
2. 确认本地已配置 `FIGMA_PAT`，不要在对话、日志或代码中输出 Token。
3. 运行 CLI 提取骨架：

   ```bash
   figma-to-code "<figma-url>" --framework=<vue|react|html>
   ```

4. 把输出作为结构参考，不要把生成结果当作无需审查的最终代码。
5. 优先复用项目已有组件和设计 token，再补充缺失的样式与交互。
6. 检查布局、文本、图片、响应式行为、状态和可访问性。
7. 运行目标项目最相关的类型检查、测试和构建。

## 约束

- 不猜测无法从设计稿确认的业务行为；沿用相邻页面或明确标注假设。
- 不提交 `.env*`、Figma PAT、临时响应或真实业务设计稿数据。
- 保留 Auto Layout、Grid、HUG/FILL、padding、绝对定位和实例覆盖表达的结构语义。
- 不为贴合设计稿而绕过项目已有组件边界。
- 改动应聚焦当前页面，避免无关重构。

## 常用参数

```bash
figma-to-code "<figma-url>" \
  --framework=react \
  --style=auto \
  --output=src/components/Generated.tsx
```

如果项目维护了专用 UI 规则，可追加 `--ui=<name>`；如果没有 token 映射，可使用 `--tokens=none`。
