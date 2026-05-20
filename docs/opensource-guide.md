# 开源管理指南

## 仓库结构

```
内部 (GitLab)                    开源 (GitHub)
├── src/                         ├── src/           ✓ 同步
├── bin/                         ├── bin/           ✓ 同步
├── template/                    ├── template/
│   ├── base/        ────────────│   ├── base/      ✓ 同步
│   ├── commands/    ────────────│   ├── commands/  ✓ 同步
│   ├── your-ui-lib/     ✗ 不同步    │   └── react/     ✓ 同步
│   ├── flutter/     ✗ 不同步    │
│   └── react/       ────────────│
├── tokens/          ✗ 不同步    │
├── docs/                        ├── docs/
│   ├── gitlab-publish.md ✗      │   └── ...        ✓ 同步
│   └── ...          ────────────│
├── .claude/skills/publish.md ✗  │
└── tests/           ────────────└── tests/         ✓ 同步 (链接替换)
```

## 使用方法

### 首次设置

```bash
# 1. 添加 GitHub remote
git remote add github git@github.com:YOUR_USERNAME/figma-to-code.git

# 2. 试运行（检查会删除/替换什么）
./scripts/sync-to-github.sh --dry-run

# 3. 检查 /tmp/figma-to-code-opensource 目录

# 4. 确认无误后正式同步
./scripts/sync-to-github.sh
```

### 日常同步

每次内部版本发布后，运行同步脚本：

```bash
./scripts/sync-to-github.sh
```

## 敏感信息清单

| 类型 | 内部值 | 开源替换值 |
|------|--------|------------|
| 产品名 | product-a | product-a |
| 产品名 | product-b | product-b |
| 产品名 | product-c | product-c |
| 产品名 | product-d | product-d |
| Registry | registry.npmjs.org | registry.npmjs.org |
| 包名 | figma-to-code | figma-to-code |

## 不同步的文件

- `tokens/` — 内部产品 token 映射
- `template/your-ui-lib/` — 内部 UI 库规则
- `template/flutter/` — 内部 Flutter 规则
- `docs/gitlab-publish.md` — 内部发布文档
- `.claude/skills/publish.md` — 内部发布 skill

## 开源版本发布

```bash
# 1. 同步到 GitHub
./scripts/sync-to-github.sh

# 2. 在 GitHub 仓库发布
cd /tmp/figma-to-code-opensource  # 或 clone GitHub 仓库
npm version patch
npm publish --access public
```

## 内部版本 vs 开源版本

| 功能 | 内部版本 | 开源版本 |
|------|----------|----------|
| 核心提取器 | ✓ | ✓ |
| Vue 生成器 | ✓ | ✓ |
| React 生成器 | ✓ | ✓ |
| Flutter 生成器 | ✓ | ✓ |
| CustomUI 模板 | ✓ | ✗ |
| 产品 Token | ✓ | ✗ |
| GitLab 发布 | ✓ | ✗ |
| npm 公开发布 | ✗ | ✓ |
