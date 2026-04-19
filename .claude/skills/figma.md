# figma

根据 Figma 链接生成项目可用的 Vue 组件。

## 用法

```
/figma <figma-url> [目标路径] [--style=unocss|css|inline]
```

## 执行步骤

**1. 生成骨架**

用 Bash 运行（将 URL 替换为用户输入的链接）：

```bash
figma-to-code <url> --framework=vue
```

> 默认自动检测项目技术栈选择样式模式。用户可用 `--style=xxx` 覆盖。

**2. 读取项目规范**

读取 `.claude/figma-context.md`。
若文件不存在，告知用户运行 `/figma-init` 初始化。

**3. 按规范翻译骨架，生成最终组件**

- 将骨架中的 INSTANCE 标签映射到项目真实组件（参考 context 中的组件映射表）
- 将原始颜色/尺寸替换为项目 token
- 容器宽度改为 `w-full`，不写死像素
- 动态内容改为 `{{ variable }}`，交互元素加 `@click` / `v-model` 占位
- 在 `<script setup>` 中补充对应的变量和方法定义

**4. 输出**

- 指定了目标路径 → 写入文件
- 未指定 → 输出到对话，由用户确认后保存
