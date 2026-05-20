---
name: 组件映射基模板
description: 定义组件映射表的格式规范和决策规则
type: base
---

# components/_catalog.md（基模板）

> 所有平台的组件映射表继承此基模板。
> 各平台在 `figma-base-{uiLib}/components/_catalog.md` 补充完整映射。

---

## 文件格式

每个平台组件映射表必须包含两个 section：

### aliases（Figma 节点名 → 组件名）

模糊匹配 Figma 骨架中的 INSTANCE 节点名，映射到项目具体组件名。

| Figma 节点名（模糊匹配） | 映射为 |
|---|---|
| Button | `Button`（示例） |
| Input | `DuInput`（示例） |

### components（组件名 → 规则文件）

组件名到规则文件的映射，用于递归翻译时查规则。

| 组件名 | 规则文件 |
|---|---|
| Button | button.md |
| DuInput | input.md |

---

## 决策规则

- 基础组件（如 Divider、Spacer）：映射到平台原生组件，不递归
- 库组件：映射到具体组件名，执行递归翻译
- 未匹配节点：在翻译结果中标注 `// INSTANCE figma-node: xxx`，由 AI 决定如何处理

---

## 设计 Token（颜色）

骨架已输出 `var(--token-name, #fallback)` 格式，可直接使用。

- 项目有对应 CSS 变量 → 自动使用 `var(--token-name)`
- 项目没有对应变量 → 自动 fallback 到原始颜色值

**无需手动维护颜色映射表。**

### 文字样式

<!-- 各平台 override 自己的映射表 -->

| 骨架输出 | 平台 token |
|---|---|
| `text-[16px] font-[500]` | （由各平台填写） |
| `text-[14px] font-[400]` | （由各平台填写） |
| `text-[12px] font-[400]` | （由各平台填写） |

<!-- 各平台在 figmabase-{uiLib}/components/_catalog.md 中补充完整映射，不要修改本基模板 -->
