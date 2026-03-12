# GitLab Package Registry 发布流程

> ⚠️ **重要提示**：GitLab 的 Package Registry 设计较为复杂，发布只能发布到 Project-level，但可以通过 Instance-level 安装（需满足 scope 规则）。

---

## 一、核心概念

### 两个级别的 Registry

| 级别 | 说明 | 用途 |
|------|------|------|
| **Project-level** | 每个 GitLab 项目都有独立的 registry | **发布包**（只能发布到这里） |
| **Instance-level** | 整个 GitLab 实例共享的 registry | **安装包**（只能安装 scope 与 group 名一致的包） |

### 关键规则

1. ✅ **发布只能发布到 Project-level**
2. ✅ **Instance-level 只能安装 scope 与 GitLab group 名一致的包**
   - 例如：group 名为 `frontend`，则只能安装 `@frontend/*` 的包
   - 如果包的 scope 是 `@foo/bar`，即使发布成功，也无法通过 Instance-level 安装

---

## 二、发布前准备

### 1. 获取必要信息

- **GitLab Group 名称**：例如 `frontend`
- **Project ID**：在 GitLab 项目页面可以看到（例如：`123`）
- **Access Token**：需要 `api` 和 `write_registry` 权限

### 2. 确定包的命名策略

**策略 A：使用 Group 名作为 scope（推荐，支持 Instance-level 安装）**

```json
{
  "name": "figma-to-code"
}
```

**策略 B：使用其他 scope（只能通过 Project-level 安装）**

```json
{
  "name": "@foo/figma-to-code"
}
```

---

## 三、发布配置步骤

### 步骤 1：修改 package.json

#### 如果使用 Group 名作为 scope（推荐）

```json
{
  "name": "figma-to-code",
  "version": "0.1.0",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/api/v4/projects/${CI_PROJECT_ID}/packages/npm/"
  }
}
```

#### 如果使用其他 scope

```json
{
  "name": "@foo/figma-to-code",
  "version": "0.1.0",
  "publishConfig": {
    "@foo:registry": "https://registry.npmjs.org/api/v4/projects/${CI_PROJECT_ID}/packages/npm/"
  }
}
```

> **注意**：`${CI_PROJECT_ID}` 在 CI/CD 环境中会自动替换，本地发布需要手动替换为实际 Project ID。

### 步骤 2：配置 npm 认证 Token

**方式 A：使用环境变量（推荐，CI/CD 环境）**

```bash
export NPM_TOKEN="YOUR_ACCESS_TOKEN"
```

**方式 B：使用 npm config（本地发布）**

```bash
# 替换 {CI_PROJECT_ID} 为实际 Project ID
npm config set -- '//registry.npmjs.org/api/v4/projects/{CI_PROJECT_ID}/packages/npm/:_authToken' "YOUR_ACCESS_TOKEN"
```

> ⚠️ **重要**：每个项目都需要单独配置一次，因为 Project ID 不同！

### 步骤 3：创建或更新 .npmrc

#### 如果使用 Group 名作为 scope（支持 Instance-level 安装）

在项目根目录创建 `.npmrc`：

```ini
registry=https://registry.npmjs.org/api/v4/packages/npm/
//registry.npmjs.org/api/v4/packages/npm/:_authToken=${NPM_TOKEN}
```

#### 如果使用其他 scope（只能通过 Project-level 安装）

在项目根目录创建 `.npmrc`：

```ini
@foo:registry=https://registry.npmjs.org/api/v4/projects/{CI_PROJECT_ID}/packages/npm/
//registry.npmjs.org/api/v4/projects/{CI_PROJECT_ID}/packages/npm/:_authToken=${NPM_TOKEN}
```

> **注意**：记得将 `.npmrc` 添加到 `.gitignore`，避免泄露 Token！

---

## 四、发布流程

### 本地发布

```bash
# 1. 构建
pnpm build

# 2. 确保已配置 Token（见步骤 2）
# 3. 确保 package.json 中的 publishConfig 正确
# 4. 确保 .npmrc 存在且正确

# 5. 发布
pnpm publish
# 或
npm publish
```

### CI/CD 发布（推荐）

在 `.gitlab-ci.yml` 中配置：

```yaml
publish:
  stage: deploy
  script:
    - echo "//registry.npmjs.org/api/v4/projects/${CI_PROJECT_ID}/packages/npm/:_authToken=${CI_JOB_TOKEN}" > .npmrc
    - pnpm build
    - pnpm publish
  only:
    - tags  # 只在打 tag 时发布
```

> **注意**：CI/CD 中可以使用 `${CI_PROJECT_ID}` 和 `${CI_JOB_TOKEN}` 变量。

---

## 五、安装配置

### 如果包的 scope 与 Group 名一致（推荐）

在需要安装的项目中创建 `.npmrc`：

```ini
registry=https://registry.npmjs.org/api/v4/packages/npm/
//registry.npmjs.org/api/v4/packages/npm/:_authToken=${NPM_TOKEN}
```

然后安装：

```bash
pnpm add figma-to-code
```

### 如果包的 scope 与 Group 名不一致

在需要安装的项目中创建 `.npmrc`：

```ini
@foo:registry=https://registry.npmjs.org/api/v4/projects/{CI_PROJECT_ID}/packages/npm/
//registry.npmjs.org/api/v4/projects/{CI_PROJECT_ID}/packages/npm/:_authToken=${NPM_TOKEN}
```

然后安装：

```bash
pnpm add @foo/figma-to-code
```

---

## 六、完整配置检查清单

### 发布前检查

- [ ] `package.json` 中的 `name` 字段已设置为带 scope 的格式（例如：`figma-to-code`）
- [ ] `package.json` 中的 `publishConfig` 已配置正确的 registry URL
- [ ] 已获取 GitLab Access Token（有 `api` 和 `write_registry` 权限）
- [ ] 已配置 npm authToken（本地或 CI/CD）
- [ ] `.npmrc` 文件已创建且配置正确
- [ ] `.npmrc` 已添加到 `.gitignore`（避免泄露 Token）
- [ ] 已运行 `pnpm build` 确保构建产物存在
- [ ] `package.json` 中的 `version` 已更新

### 安装前检查

- [ ] 已创建 `.npmrc` 文件
- [ ] `.npmrc` 中的 registry URL 正确
- [ ] 已配置 Access Token（环境变量或直接写入）
- [ ] 如果使用 Instance-level，确认包的 scope 与 Group 名一致

---

## 七、常见问题

### Q1: 为什么发布后无法通过 Instance-level 安装？

**A**: 检查包的 scope 是否与 GitLab Group 名一致。
- ✅ 正确：Group 名 `frontend`，包名 `@frontend/xxx`
- ❌ 错误：Group 名 `frontend`，包名 `@foo/xxx`

### Q2: 每个项目都要单独配置 Token 吗？

**A**: 是的，因为每个项目的 Project ID 不同，registry URL 也不同。但可以使用环境变量 `${NPM_TOKEN}` 统一管理。

### Q3: CI/CD 中如何自动替换 Project ID？

**A**: 使用 GitLab CI 变量 `${CI_PROJECT_ID}`，会自动替换为当前项目的 ID。

### Q4: 本地发布时如何替换 Project ID？

**A**: 手动替换 `package.json` 和 `.npmrc` 中的 `{CI_PROJECT_ID}` 为实际 Project ID，或使用脚本自动替换。

---

## 八、推荐实践

1. **统一使用 Group 名作为 scope**
   - 便于通过 Instance-level 安装
   - 减少配置复杂度

2. **使用 CI/CD 自动发布**
   - 避免手动配置 Project ID
   - 使用 `${CI_JOB_TOKEN}` 更安全

3. **Token 管理**
   - 使用环境变量 `${NPM_TOKEN}`
   - 不要将 Token 提交到代码仓库

4. **版本管理**
   - 使用 `npm version` 命令管理版本
   - 在 CI/CD 中只在打 tag 时发布

---

## 九、当前项目配置示例

假设当前项目信息：
- Group: `frontend`
- Project ID: `123`（需要替换为实际值）
- Package Name: `figma-to-code`

### package.json

```json
{
  "name": "figma-to-code",
  "version": "0.1.0",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/api/v4/projects/${CI_PROJECT_ID}/packages/npm/"
  }
}
```

### .npmrc（本地发布）

```ini
registry=https://registry.npmjs.org/api/v4/projects/123/packages/npm/
//registry.npmjs.org/api/v4/projects/123/packages/npm/:_authToken=${NPM_TOKEN}
```

### .npmrc（安装时）

```ini
registry=https://registry.npmjs.org/api/v4/packages/npm/
//registry.npmjs.org/api/v4/packages/npm/:_authToken=${NPM_TOKEN}
```

---

## 十、快速参考命令

```bash
# 1. 配置 Token（本地发布，替换 {PROJECT_ID}）
npm config set -- '//registry.npmjs.org/api/v4/projects/{PROJECT_ID}/packages/npm/:_authToken' "YOUR_TOKEN"

# 2. 构建
pnpm build

# 3. 发布
pnpm publish

# 4. 安装（在其他项目中）
pnpm add figma-to-code
```
