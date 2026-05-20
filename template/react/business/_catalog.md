---
uiLib: react
---

# 业务组件索引

> 本文件继承 `commands/business/_catalog.md`（基模板），决策规则自动生效。

---

<!--
骨架中未识别的 INSTANCE 节点会附带 {/* figma-node: xxx */} 注释。
翻译时按本表决策，三种情况：
  1. 文件路径为 "-"  → 已知基础组件，直接使用，不递归
  2. 文件路径有值    → 已生成的业务组件，直接 import，不递归
  3. 未匹配          → 询问用户是否生成、保存在哪里，确认后递归生成子组件，完成后补充本表
-->

| Figma 组件名（模糊匹配） | 项目组件 | 文件路径 | 备注 |
|---|---|---|---|
<!-- 每次递归生成新组件后，在此补充一行，例如：
| ProductCard | `ProductCard` | src/components/ProductCard.tsx | 已生成 |
-->