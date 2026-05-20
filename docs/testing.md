# 发包与本地验证流程

## 一、本地开发验证

### 1. 构建

```bash
pnpm build
```

构建产物输出到 `dist/`：

```
dist/
├── src/index.js      # 库入口
├── src/index.d.ts
└── bin/cli.js        # CLI 入口
```

### 2. 本地链接到全局

```bash
# 在 figma-to-code 目录执行
pnpm link --global

# 验证
figma-to-code --help
```

### 3. 在目标项目中使用本地版本

```bash
cd /path/to/your-project

# 方式一：直接用全局链接的 CLI（推荐）
figma-to-code init

# 方式二：项目内链接（适合需要 import 库代码的场景）
pnpm link figma-to-code
```

### 4. 本地路径安装（最接近真实发包的验证方式）

在目标项目中直接用本地路径安装，行为和从 npm 安装一致：

```bash
cd /path/to/your-project

pnpm add /path/to/figma-to-code
# 或相对路径
pnpm add ../figma-to-code
```

安装后 `package.json` 会记录：

```json
{
  "dependencies": {
    "figma-to-code": "link:../figma-to-code"
  }
}
```

此方式会直接引用 `dist/` 产物（需提前 `pnpm build`），比 `pnpm link` 更接近用户实际安装体验。

CLI 同样可用：

```bash
npx figma-to-code init
# 或在 package.json scripts 中配置
```

### 5. 取消链接

```bash
# 在 figma-to-code 目录
pnpm unlink --global

# 在目标项目
pnpm unlink figma-to-code
```

---

## 二、发包前检查

### 检查 package.json

确认以下字段正确：

```json
{
  "version": "x.x.x",
  "main": "dist/src/index.js",
  "types": "dist/src/index.d.ts",
  "bin": {
    "figma-to-code": "./dist/bin/cli.js"
  },
  "files": ["dist", "README.md"]
}
```

`files` 字段决定哪些文件会被打包进 npm 包。可用以下命令预览：

```bash
npx pkg-check   # 或
npm pack --dry-run
```

### 运行测试

```bash
pnpm test:run
```

### 检查 dist 产物是否正确

```bash
# 确认 cli.js 有执行权限且 shebang 正确
head -1 dist/bin/cli.js
# 应输出：#!/usr/bin/env node
```

---

## 三、发布到 npm

### 首次发布

```bash
# 登录 npm（已登录可跳过）
npm login

# 发布（package.json 中 publishConfig.access 已设为 public）
npm publish
```

### 更新版本发布

```bash
# 升补丁版本 0.1.0 → 0.1.1
npm version patch

# 升次版本 0.1.0 → 0.2.0
npm version minor

# 手动指定
npm version 1.0.0

# 发布
npm publish
```

---

## 四、发布后验证

### 全局安装测试

```bash
# 安装
pnpm add -g figma-to-code

# 验证 CLI
figma-to-code --help

# 在业务项目中初始化
cd /path/to/your-project
npx figma-to-code init --ui=your-ui-lib
```

### 项目内安装测试

```bash
pnpm add figma-to-code

# 用 npx 调用
npx figma-to-code init
```

---

## 五、完整使用流程验证

按顺序执行，确认每步无报错：

```bash
# 1. 配置 PAT（首次，全局）
security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "your-token"

# 2. 在业务项目初始化
figma-to-code init --ui=your-ui-lib

# 3. 编辑 .claude/figma-context.md 补充项目配置（手动）

# 4. 验证骨架生成
figma-to-code "https://www.figma.com/design/xxx/...?node-id=123-456"
# 预期：输出 Vue 骨架到 stdout

# 5. 在 IDE AI 聊天窗口使用
# /figma https://www.figma.com/design/xxx/...?node-id=123-456
```

### 常见报错

| 报错 | 原因 | 解决 |
|---|---|---|
| `command not found: figma-to-code` | 未全局安装或链接 | `pnpm add -g figma-to-code` |
| `未找到 Figma PAT` | PAT 未配置 | 按第 1 步配置 |
| `无法解析 Figma URL` | 链接缺少 `node-id` | 在 Figma 右键节点复制链接 |
| `403 Forbidden` | PAT 无权限或过期 | 重新生成 PAT |
| `dist/bin/cli.js not found` | 未构建 | `pnpm build` |
