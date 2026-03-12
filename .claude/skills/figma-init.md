# figma-init

扫描当前项目，自动生成 `.claude/figma-context.md` 项目规范文件。
运行一次即可，后续 `/figma` skill 会自动读取。

## 执行步骤

**第一步：扫描组件使用模式**

在项目中查找 `.vue` 文件，重点关注：
- `src/views/` 或 `src/pages/` 下的页面文件（了解实际组件用法）
- `src/components/` 下的组件文件（了解封装方式）

读取 3～5 个有代表性的页面文件，从中提取：
- 使用了哪些组件（`<Du*>`、`<Van*>` 等）
- 间距/颜色 class 的命名规律
- 布局模式（`flex`、`grid` 等）

**第二步：扫描组件库定义**

查找组件库的类型定义或文档：
- `node_modules` 中对应包的 `*.d.ts` 或 `README.md`
- 项目内 `src/components/` 的 index 文件

提取常用组件的 props 签名，重点关注：表单、按钮、输入框、弹窗、列表、图标。

**第三步：扫描 UnoCSS 配置**

读取 `uno.config.ts` 或 `unocss.config.ts`，提取：
- `theme.spacing` 基准值（判断 1unit = 1px 还是 4px）
- 自定义 shortcuts（如 `text-h4`、`c-text-2` 等 token）
- 自定义 rules

**第四步：生成 `.claude/figma-context.md`**

按以下模板格式生成文件，内容由扫描结果填充：

```markdown
# 项目 Figma 规范

## 组件库
...

## UnoCSS 配置
...

## 设计 Token
...

## 组件映射规则
...

## 示例
...
```

生成后告知用户文件位置，并建议检查是否有遗漏或需要手动补充的内容。
