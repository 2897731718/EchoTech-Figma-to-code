#!/bin/bash
# 开源同步脚本：将内部仓库同步到 GitHub（过滤敏感信息）
# 用法: ./scripts/sync-to-github.sh [--dry-run]

set -e

# 配置
GITHUB_REMOTE="github"
GITHUB_BRANCH="main"
TEMP_DIR="/tmp/figma-to-code-opensource"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[sync]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

DRY_RUN=false
[[ "$1" == "--dry-run" ]] && DRY_RUN=true && warn "Dry run mode"

# 检查 GitHub remote 是否存在（dry-run 模式下跳过）
if ! git remote get-url $GITHUB_REMOTE &>/dev/null; then
  if $DRY_RUN; then
    warn "GitHub remote '$GITHUB_REMOTE' 不存在，dry-run 模式继续执行"
  else
    error "GitHub remote '$GITHUB_REMOTE' 不存在。请先添加：
  git remote add github git@github.com:YOUR_USERNAME/figma-to-code.git"
  fi
fi

# 清理临时目录
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

log "复制项目到临时目录..."
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' . "$TEMP_DIR/"

cd "$TEMP_DIR"

# ─────────────────────────────────────────────────────────────
# 1. 删除敏感文件/目录
# ─────────────────────────────────────────────────────────────
log "删除敏感文件..."

# 内部 token 映射
rm -rf tokens/

# 内部组件模板（保留 base 作为示例）
rm -rf template/your-ui-lib/
rm -rf template/flutter/

# 内部文档
rm -f docs/gitlab-publish.md
rm -f docs/integration-output.log

# 内部 Claude 配置
rm -rf .claude/skills/publish.md
rm -rf .claude/commands/figma-flutter.md

# ─────────────────────────────────────────────────────────────
# 2. 替换敏感内容
# ─────────────────────────────────────────────────────────────
log "替换敏感内容..."

***REMOVED***
find . -type f \( -name "*.ts" -o -name "*.md" -o -name "*.json" \) -exec sed -i '' \
  -e 's/product-a/product-a/g' \
  -e 's/product-b/product-b/g' \
  -e 's/product-c/product-c/g' \
  -e 's/product-d/product-d/g' \
  -e 's/Product A/Product A/g' \
  -e 's/Product B/Product B/g' \
  -e 's/Product C/Product C/g' \
  -e 's/Product D/Product D/g' \
  {} \;

# GitLab registry → npmjs
find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" \) -exec sed -i '' \
  -e 's|https://registry.npmjs.org/api/v4/npm/packages/npm/|https://registry.npmjs.org/|g' \
  -e 's|https://registry.npmjs.org/api/v4/packages/npm/|https://registry.npmjs.org/|g' \
  -e 's|g\.echo\.tech|registry.npmjs.org|g' \
  -e 's|npm registry|npm registry|g' \
  -e 's|npm|npm|g' \
  {} \;

# 包名：去掉内部 scope（所有文件）
find . -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/@frontend\/figma-to-code/figma-to-code/g' \
  -e 's/registry/registry/g' \
  -e 's/npm config set registry/npm config set registry/g' \
  {} \;

# 更新 package.json 的 publishConfig
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.name = 'figma-to-code';
pkg.publishConfig = {
  registry: 'https://registry.npmjs.org/',
  access: 'public'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# ─────────────────────────────────────────────────────────────
# 3. 清理测试文件中的内部 Figma 链接
# ─────────────────────────────────────────────────────────────
log "清理测试文件..."

# 替换集成测试中的真实 Figma 链接
sed -i '' \
  -e "s|https://www.figma.com/design/[^'\"]*|https://www.figma.com/design/EXAMPLE/Demo?node-id=1-2|g" \
  tests/integration.test.ts

# ─────────────────────────────────────────────────────────────
# 4. 添加开源文件
# ─────────────────────────────────────────────────────────────
log "添加开源文件..."

# LICENSE (MIT)
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 figma-to-code contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# CONTRIBUTING.md
cat > CONTRIBUTING.md << 'EOF'
# Contributing

We welcome contributions! Please follow these guidelines:

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a PR

## Code Style

- TypeScript strict mode
- ESM only
- No runtime dependencies
EOF

# ─────────────────────────────────────────────────────────────
# 5. 验证
# ─────────────────────────────────────────────────────────────
log "验证敏感信息已清理..."

SENSITIVE_PATTERNS=(
  "echo\.tech"
  "product-a"
  "product-b"
  "product-c"
  "product-d"
  "@frontend"
  "1455"
)

FOUND_SENSITIVE=false
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if grep -rq "$pattern" --include="*.ts" --include="*.md" --include="*.json" . 2>/dev/null; then
    warn "仍包含敏感内容: $pattern"
    grep -rn "$pattern" --include="*.ts" --include="*.md" --include="*.json" . 2>/dev/null | head -3
    FOUND_SENSITIVE=true
  fi
done

if $FOUND_SENSITIVE; then
  error "请手动清理上述敏感内容后重试"
fi

log "敏感信息检查通过 ✓"

# ─────────────────────────────────────────────────────────────
# 6. 推送到 GitHub
# ─────────────────────────────────────────────────────────────
if $DRY_RUN; then
  log "Dry run 完成，清理后的文件在: $TEMP_DIR"
  log "检查后运行 (不带 --dry-run) 来推送"
  exit 0
fi

log "初始化 Git 并推送..."
git init
git add -A
git commit -m "chore: sync from internal repo

- Core figma-to-code extractor
- Vue/React/Flutter generators
- Template system for custom UI libraries"

git remote add origin "$(cd - && git remote get-url $GITHUB_REMOTE)"
git branch -M $GITHUB_BRANCH
git push -f origin $GITHUB_BRANCH

log "同步完成 ✓"
log "GitHub: $(git remote get-url origin)"

# 清理
cd -
rm -rf "$TEMP_DIR"
