#!/usr/bin/env node
/**
 * figma-to-code CLI
 *
 * 用法：
 *   figma-to-code init                    初始化项目 skill 文件
 *   figma-to-code <figma-url> [选项]      生成骨架并输出到 stdout
 *
 * 选项：
 *   --framework=vue|html|react  默认 vue
 *   --style=auto|unocss|css|inline      默认 auto（自动检测项目技术栈）
 *   --fold-prefixes=💙                  白名单：匹配的组件折叠
 *   --no-fold-prefixes=👻               黑名单：匹配的组件不折叠
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { convertFigmaToCode } from '../src/index'
import { checkForUpdate, printUpdateBanner, runAutoUpdate } from '../src/version-check'

// ── 自动检测项目样式模式 ────────────────────────────────────────────────────

type StyleMode = 'unocss' | 'css' | 'inline'

interface DetectResult {
  mode: StyleMode
  reason: string
}

// 检测配置文件是否存在（支持多种扩展名）
function hasConfig(cwd: string, baseName: string): boolean {
  const exts = ['.ts', '.js', '.mts', '.mjs', '.cjs']
  return exts.some(ext => existsSync(resolve(cwd, baseName + ext)))
}

// 读取依赖（当前目录 + monorepo 根目录）
function readDeps(cwd: string): Record<string, string> {
  let deps: Record<string, string> = {}
  let dir = cwd

  // 向上查找，合并所有 package.json 的依赖（monorepo 支持）
  while (dir !== dirname(dir)) {
    const pkgPath = resolve(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        deps = { ...pkg.dependencies, ...pkg.devDependencies, ...deps }
        // 遇到 monorepo 根（有 workspaces）或已找到目标依赖时停止
        if (pkg.workspaces || deps['unocss'] || deps['tailwindcss']) break
      } catch { /* ignore */ }
    }
    dir = dirname(dir)
  }
  return deps
}

// 检测 vite.config 中是否使用 UnoCSS
function hasUnocssInViteConfig(cwd: string): boolean {
  const viteConfigs = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']
  for (const name of viteConfigs) {
    const configPath = resolve(cwd, name)
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8')
        if (/unocss|UnoCSS/.test(content)) return true
      } catch { /* ignore */ }
    }
  }
  return false
}

function detectStyleMode(cwd: string = process.cwd()): DetectResult {
  const pkgDeps = readDeps(cwd)

  // 1. 检测 UnoCSS（配置文件 → vite 插件 → 依赖）
  if (hasConfig(cwd, 'uno.config') || hasConfig(cwd, 'unocss.config')) {
    return { mode: 'unocss', reason: '检测到 uno(css).config.*' }
  }
  if (hasUnocssInViteConfig(cwd)) {
    return { mode: 'unocss', reason: '检测到 vite.config 中使用 UnoCSS' }
  }
  if (pkgDeps['unocss']) {
    return { mode: 'unocss', reason: '检测到 unocss 依赖' }
  }

  // 2. 检测 Tailwind CSS
  if (hasConfig(cwd, 'tailwind.config')) {
    return { mode: 'unocss', reason: '检测到 tailwind.config.*' }
  }
  if (pkgDeps['tailwindcss']) {
    return { mode: 'unocss', reason: '检测到 tailwindcss 依赖' }
  }

  // 3. 检测 WindiCSS
  if (hasConfig(cwd, 'windi.config')) {
    return { mode: 'unocss', reason: '检测到 windi.config.*' }
  }
  if (pkgDeps['windicss']) {
    return { mode: 'unocss', reason: '检测到 windicss 依赖' }
  }

  // 4. 检测微信小程序
  if (existsSync(resolve(cwd, 'app.json')) && existsSync(resolve(cwd, 'project.config.json'))) {
    return { mode: 'inline', reason: '检测到微信小程序项目' }
  }

  // 5. 检测 Taro
  if (pkgDeps['@tarojs/taro'] || hasConfig(cwd, 'config/index')) {
    return { mode: 'inline', reason: '检测到 Taro 项目' }
  }

  // 6. 检测 uni-app
  if (existsSync(resolve(cwd, 'pages.json')) || pkgDeps['@dcloudio/uni-app']) {
    return { mode: 'inline', reason: '检测到 uni-app 项目' }
  }

  // 7. 检测 React Native
  if (pkgDeps['react-native']) {
    return { mode: 'inline', reason: '检测到 React Native 项目' }
  }

  // 8. 默认使用 css 模式
  return { mode: 'css', reason: '未检测到原子 CSS 框架，使用传统 CSS' }
}

// ── 项目 Token 扫描 ────────────────────────────────────────────────────────

interface TokenInfo {
  name: string        // CSS 变量名，如 --text-1
  value: string       // 原始值，如 #333333
  category?: string   // 分类，如 color、spacing
}

/**
 * 从 UnoCSS/Tailwind 配置或 CSS 文件中提取项目 token
 */
function scanProjectTokens(cwd: string = process.cwd()): TokenInfo[] {
  const tokens: TokenInfo[] = []

  // 1. 扫描 CSS 文件中的 :root 变量定义
  const cssPatterns = [
    'src/**/*.css',
    'styles/**/*.css',
    'assets/**/*.css',
    'app.css',
    'index.css',
    'global.css',
    'variables.css',
  ]

  for (const pattern of cssPatterns) {
    const cssFiles = findFiles(cwd, pattern)
    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf-8')
      const rootTokens = extractCssRootVariables(content)
      tokens.push(...rootTokens)
    }
  }

  // 2. 扫描 UnoCSS 配置
  const unoConfigPath = resolve(cwd, 'uno.config.ts')
  if (existsSync(unoConfigPath)) {
    const content = readFileSync(unoConfigPath, 'utf-8')
    const unoTokens = extractUnoTokens(content)
    tokens.push(...unoTokens)
  }

  // 3. 扫描 Tailwind 配置
  const tailwindConfigPath = resolve(cwd, 'tailwind.config.js')
  if (existsSync(tailwindConfigPath)) {
    const content = readFileSync(tailwindConfigPath, 'utf-8')
    const tailwindTokens = extractTailwindTokens(content)
    tokens.push(...tailwindTokens)
  }

  // 去重
  const seen = new Set<string>()
  return tokens.filter(t => {
    if (seen.has(t.name)) return false
    seen.add(t.name)
    return true
  })
}

/**
 * 简单的 glob 匹配，找到匹配的文件
 */
function findFiles(cwd: string, pattern: string): string[] {
  const results: string[] = []
  const parts = pattern.split('/')

  function walk(dir: string, depth: number) {
    if (depth >= parts.length) return

    const part = parts[depth]
    const isLast = depth === parts.length - 1

    if (!existsSync(dir)) return

    try {
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (part === '**') {
          // 递归匹配
          if (entry.isDirectory()) {
            walk(resolve(dir, entry.name), depth)
            walk(resolve(dir, entry.name), depth + 1)
          } else if (isLast || parts[depth + 1] === '*.css') {
            if (entry.name.endsWith('.css')) {
              results.push(resolve(dir, entry.name))
            }
          }
        } else if (part.includes('*')) {
          // 通配符匹配
          const regex = new RegExp('^' + part.replace(/\*/g, '.*') + '$')
          if (regex.test(entry.name)) {
            if (isLast && entry.isFile()) {
              results.push(resolve(dir, entry.name))
            } else if (entry.isDirectory()) {
              walk(resolve(dir, entry.name), depth + 1)
            }
          }
        } else {
          // 精确匹配
          if (entry.name === part) {
            if (isLast && entry.isFile()) {
              results.push(resolve(dir, entry.name))
            } else if (entry.isDirectory()) {
              walk(resolve(dir, entry.name), depth + 1)
            }
          }
        }
      }
    } catch { /* 忽略权限错误 */ }
  }

  walk(cwd, 0)
  return results
}

/**
 * 从 CSS 内容中提取 :root 变量
 */
function extractCssRootVariables(content: string): TokenInfo[] {
  const tokens: TokenInfo[] = []

  // 匹配 :root { ... } 块
  const rootMatch = content.match(/:root\s*\{([^}]+)\}/g)
  if (!rootMatch) return tokens

  for (const block of rootMatch) {
    // 匹配 --name: value;
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g
    let match
    while ((match = varRegex.exec(block)) !== null) {
      const name = `--${match[1]}`
      const value = match[2].trim()

      // 判断分类
      let category: string | undefined
      if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
        category = 'color'
      } else if (value.endsWith('px') || value.endsWith('rem') || value.endsWith('em')) {
        category = 'spacing'
      }

      tokens.push({ name, value, category })
    }
  }

  return tokens
}

/**
 * 从 UnoCSS 配置中提取 theme tokens
 */
function extractUnoTokens(content: string): TokenInfo[] {
  const tokens: TokenInfo[] = []

  // 简单提取 colors 对象中的定义
  // 匹配 'name': 'var(--xxx)' 或 name: 'var(--xxx)'
  const colorRegex = /['"]?([\w-]+)['"]?\s*:\s*['"]var\((--[\w-]+)\)['"]|['"]?([\w-]+)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})['"]?/g
  let match
  while ((match = colorRegex.exec(content)) !== null) {
    if (match[2]) {
      // var(--xxx) 形式
      tokens.push({ name: match[2], value: `var(${match[2]})`, category: 'color' })
    } else if (match[4]) {
      // #hex 形式
      tokens.push({ name: `--${match[3]}`, value: match[4], category: 'color' })
    }
  }

  return tokens
}

/**
 * 从 Tailwind 配置中提取 theme tokens
 */
function extractTailwindTokens(content: string): TokenInfo[] {
  // 与 UnoCSS 类似的提取逻辑
  return extractUnoTokens(content)
}

/**
 * 生成 project-tokens.md 文件
 */
function generateTokensDoc(tokens: TokenInfo[], outputPath: string): void {
  const colorTokens = tokens.filter(t => t.category === 'color')
  const spacingTokens = tokens.filter(t => t.category === 'spacing')
  const otherTokens = tokens.filter(t => !t.category)

  let content = `# 项目 Token 列表

> 此文件由 \`figma-to-code init\` 自动生成，翻译骨架时参考此文件匹配 token。
> 骨架中的 \`var(--xxx, #fallback)\` 如果 \`--xxx\` 在此列表中，保留 token；否则使用 fallback 值。

`

  if (colorTokens.length > 0) {
    content += `## 颜色 Token

| Token 名 | 值 |
|----------|-----|
`
    for (const t of colorTokens) {
      content += `| \`${t.name}\` | \`${t.value}\` |\n`
    }
    content += '\n'
  }

  if (spacingTokens.length > 0) {
    content += `## 间距 Token

| Token 名 | 值 |
|----------|-----|
`
    for (const t of spacingTokens) {
      content += `| \`${t.name}\` | \`${t.value}\` |\n`
    }
    content += '\n'
  }

  if (otherTokens.length > 0) {
    content += `## 其他 Token

| Token 名 | 值 |
|----------|-----|
`
    for (const t of otherTokens) {
      content += `| \`${t.name}\` | \`${t.value}\` |\n`
    }
    content += '\n'
  }

  if (tokens.length === 0) {
    content += `*未检测到项目 token，请手动补充或检查 CSS/UnoCSS/Tailwind 配置。*\n`
  }

  writeFileSync(outputPath, content)
}

const args = process.argv.slice(2)
const command = args[0]

// ── init 子命令 ────────────────────────────────────────────────────────────

if (command === 'init') {
  // figma-to-code init [--ui=react] [--force] [--skip-check]
  const uiLib = args.find(a => a.startsWith('--ui='))?.split('=')[1]
  const force = args.includes('--force')
  const skipCheck = args.includes('--skip-check')

  // ── 前置条件检测 ────────────────────────────────────────────
  if (!skipCheck) {
    console.log('🔍 检测环境...\n')

    // 1. 检测 Figma PAT
    let hasPAT = false

    // 检查 .env.local
    const envLocalPath = resolve(process.cwd(), '.env.local')
    if (existsSync(envLocalPath)) {
      const envContent = readFileSync(envLocalPath, 'utf-8')
      if (envContent.includes('FIGMA_PAT=')) hasPAT = true
    }

    // 检查环境变量
    if (!hasPAT && process.env.FIGMA_PAT) hasPAT = true

    // 检查 macOS Keychain
    if (!hasPAT && process.platform === 'darwin') {
      for (const service of ['FIGMA_PAT_GLOBAL', 'FIGMA_PAT']) {
        try {
          execSync(`security find-generic-password -s ${service} -w 2>/dev/null`, { stdio: 'pipe' })
          hasPAT = true
          break
        } catch { /* not found */ }
      }
    }

    if (!hasPAT) {
      console.error('✖ 未检测到 Figma PAT，请先配置后再运行 init\n')
      console.error('  配置方式（二选一）：\n')
      console.error('  方式一：macOS Keychain（推荐，跨项目共用）')
      console.error('    security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "你的TOKEN"\n')
      console.error('  方式二：项目 .env.local')
      console.error('    echo \'FIGMA_PAT=你的TOKEN\' >> .env.local\n')
      console.error('  获取 Token：Figma 左上角 Logo → Help and account → Account settings → Security → Personal access tokens')
      console.error('\n  配置完成后重新运行此命令。如需跳过检测，使用 --skip-check')
      process.exit(1)
    }
    console.log('  ✔ Figma PAT 已配置')
    console.log('')
  }

  // ── 复制文件 ────────────────────────────────────────────────
  const __dir = dirname(fileURLToPath(import.meta.url))
  // dist/bin/ -> 上两级到包根目录
  const pkgRoot = resolve(__dir, '../..')
  const templateDir = resolve(pkgRoot, 'template')
  const targetDir = resolve(process.cwd(), '.claude')
  const commandsDir = resolve(targetDir, 'commands')

  mkdirSync(commandsDir, { recursive: true })

  // Codex 使用仓库级 Skill，并与 Claude command 共用 figma-base 规则。
  const installCodexSkill = (): void => {
    const skillSrc = resolve(templateDir, 'codex/figma-to-code/SKILL.md')
    const skillDst = resolve(process.cwd(), '.agents/skills/figma-to-code/SKILL.md')
    if (!existsSync(skillSrc)) {
      console.log('⚠ 未找到 Codex Skill 模板，跳过安装')
      return
    }

    const existed = existsSync(skillDst)
    if (existed && !force) {
      console.log('⚠ .agents/skills/figma-to-code/SKILL.md 已存在，跳过（升级用 --force 覆盖）')
      return
    }

    mkdirSync(dirname(skillDst), { recursive: true })
    copyFileSync(skillSrc, skillDst)
    console.log(`${existed ? '✔ 已更新' : '✔ 已创建'} .agents/skills/figma-to-code/SKILL.md`)
  }

  const installClaudeCommand = (fileName: 'figma.md'): void => {
    const commandSrc = resolve(templateDir, 'commands', fileName)
    const commandDst = resolve(commandsDir, fileName)
    if (!existsSync(commandSrc)) return

    const existed = existsSync(commandDst)
    if (existed && !force) {
      console.log(`⚠ .claude/commands/${fileName} 已存在，跳过（升级用 --force 覆盖）`)
      return
    }

    copyFileSync(commandSrc, commandDst)
    console.log(`${existed ? '✔ 已更新' : '✔ 已创建'} .claude/commands/${fileName}`)
  }

  // 安装 Claude Code 的 Web slash command
  installClaudeCommand('figma.md')

  installCodexSkill()

  // 复制 figma-base 目录（按需加载的组件规则）
  // 结构：先复制 base/ 基础模板，再合并 {uiLib}/ 特有规则
  {
    const baseDst = resolve(targetDir, 'figma-base')
    if (existsSync(baseDst)) {
      const coreDst = resolve(baseDst, 'core.md')
      if (!existsSync(coreDst)) {
        const uiCoreSrc = uiLib ? resolve(templateDir, uiLib, 'core.md') : ''
        const coreSrc = uiCoreSrc && existsSync(uiCoreSrc)
          ? uiCoreSrc
          : resolve(templateDir, 'base/core.md')
        if (existsSync(coreSrc)) {
          copyFileSync(coreSrc, coreDst)
          console.log('✔ 已补齐缺失的 .claude/figma-base/core.md')
        }
      }
      console.log('⚠ .claude/figma-base/ 已存在，跳过（使用 figma-to-code update 更新）')
    } else {
      // 1. 先复制 base/ 基础模板
      const baseSrc = resolve(templateDir, 'base')
      if (existsSync(baseSrc)) {
        mkdirSync(baseDst, { recursive: true })
        const coreSrc = resolve(baseSrc, 'core.md')
        if (existsSync(coreSrc)) {
          copyFileSync(coreSrc, resolve(baseDst, 'core.md'))
        }
        // 复制 base/business.md → figma-base/business/_catalog.md
        const businessSrc = resolve(baseSrc, 'business.md')
        if (existsSync(businessSrc)) {
          mkdirSync(resolve(baseDst, 'business'), { recursive: true })
          copyFileSync(businessSrc, resolve(baseDst, 'business', '_catalog.md'))
        }
        // 复制 base/components.md → figma-base/components/_catalog.md
        const componentsSrc = resolve(baseSrc, 'components.md')
        if (existsSync(componentsSrc)) {
          mkdirSync(resolve(baseDst, 'components'), { recursive: true })
          copyFileSync(componentsSrc, resolve(baseDst, 'components', '_catalog.md'))
        }
      }

      // 2. 再合并 {uiLib}/ 特有规则（会覆盖 base 同名文件）
      if (uiLib) {
        const uiLibSrc = resolve(templateDir, uiLib)
        if (existsSync(uiLibSrc)) {
          cpSync(uiLibSrc, baseDst, { recursive: true })
        }
      }

      const versionFile = resolve(baseDst, 'version.txt')
      const version = existsSync(versionFile) ? readFileSync(versionFile, 'utf-8').trim() : 'unknown'
      console.log(`✔ 已创建 .claude/figma-base/（版本 ${version}）`)
    }
  }

  // ── 扫描项目 Token ────────────────────────────────────────────
  const tokensDst = resolve(targetDir, 'project-tokens.md')
  if (existsSync(tokensDst)) {
    console.log('⚠ .claude/project-tokens.md 已存在，跳过')
  } else {
    console.log('🔍 扫描项目 token...')
    const tokens = scanProjectTokens(process.cwd())
    if (tokens.length > 0) {
      generateTokensDoc(tokens, tokensDst)
      console.log(`✔ 已生成 .claude/project-tokens.md（${tokens.length} 个 token）`)
    } else {
      console.log('  未检测到 token，跳过生成 project-tokens.md')
      console.log('  （可手动创建或检查 CSS/:root 变量定义）')
    }
  }

  // ── 完成提示 ────────────────────────────────────────────────
  console.log('\n✅ 安装完成！\n')
  console.log('使用方式：')
  console.log('  Claude Code: /figma <figma-url>  生成代码')
  console.log('  Codex: $figma-to-code <figma-url> 生成代码')
  console.log('  编辑 .claude/figma-base/ 下的规范文件（如需更新请运行 figma-to-code update）')
  maybeCheckForUpdate()
  process.exit(0)
}

// ── update 子命令 ────────────────────────────────────────────────────────────

if (command === 'update') {
  // figma-to-code update [--ui=react]
  const uiLib = args.find(a => a.startsWith('--ui='))?.split('=')[1]

  const __dir = dirname(fileURLToPath(import.meta.url))
  const pkgRoot = resolve(__dir, '../..')
  const templateDir = resolve(pkgRoot, 'template')
  const targetDir = resolve(process.cwd(), '.claude')
  const baseDst = resolve(targetDir, 'figma-base')

  // 检测当前使用的 UI 库
  let detectedUiLib = uiLib
  if (!detectedUiLib && existsSync(baseDst)) {
    // 从 components/_catalog.md 的 frontmatter 读取 uiLib
    const catalogPath = resolve(baseDst, 'components', '_catalog.md')
    if (existsSync(catalogPath)) {
      try {
        const content = readFileSync(catalogPath, 'utf-8')
        const match = content.match(/^---\n([\s\S]*?)\n---/)
        if (match) {
          const frontmatter = match[1]
          const uiLibMatch = frontmatter.match(/uiLib:\s*(\S+)/)
          if (uiLibMatch) detectedUiLib = uiLibMatch[1]
        }
      } catch { /* ignore */ }
    }
  }

  if (!detectedUiLib) {
    console.error('✖ 无法检测当前 UI 库，请使用 --ui=<name> 指定')
    console.error('  例如: figma-to-code update --ui=react')
    process.exit(1)
  }

  // 检查 uiLib 模板目录是否存在
  const uiLibSrc = resolve(templateDir, detectedUiLib)
  if (!existsSync(uiLibSrc)) {
    console.error(`✖ 未找到 ${detectedUiLib} 模板`)
    process.exit(1)
  }

  // 读取当前版本
  let currentVersion = 'unknown'
  const currentVersionFile = resolve(baseDst, 'version.txt')
  if (existsSync(currentVersionFile)) {
    currentVersion = readFileSync(currentVersionFile, 'utf-8').trim()
  }

  // 读取新版本
  const newVersionFile = resolve(uiLibSrc, 'version.txt')
  const newVersion = existsSync(newVersionFile) ? readFileSync(newVersionFile, 'utf-8').trim() : 'unknown'

  if (currentVersion === newVersion) {
    console.log(`✔ figma-base 已是最新版本（${currentVersion}）`)
    process.exit(0)
  }

  // 删除旧目录，重新复制（先 base 再 uiLib）
  if (existsSync(baseDst)) {
    rmSync(baseDst, { recursive: true })
  }
  mkdirSync(baseDst, { recursive: true })

  // 1. 复制 base/ 基础模板
  const baseSrc = resolve(templateDir, 'base')
  if (existsSync(baseSrc)) {
    const coreSrc = resolve(baseSrc, 'core.md')
    if (existsSync(coreSrc)) {
      copyFileSync(coreSrc, resolve(baseDst, 'core.md'))
    }
    const businessSrc = resolve(baseSrc, 'business.md')
    if (existsSync(businessSrc)) {
      mkdirSync(resolve(baseDst, 'business'), { recursive: true })
      copyFileSync(businessSrc, resolve(baseDst, 'business', '_catalog.md'))
    }
    const componentsSrc = resolve(baseSrc, 'components.md')
    if (existsSync(componentsSrc)) {
      mkdirSync(resolve(baseDst, 'components'), { recursive: true })
      copyFileSync(componentsSrc, resolve(baseDst, 'components', '_catalog.md'))
    }
  }

  // 2. 合并 uiLib 特有规则
  cpSync(uiLibSrc, baseDst, { recursive: true })

  console.log(`✔ figma-base 已更新: ${currentVersion} → ${newVersion}`)
  console.log('  （figma-base 目录已更新，如有个性化修改请手动合并）')
  process.exit(0)
}

// ── diff 子命令 ────────────────────────────────────────────────────────────

if (command === 'diff') {
  // figma-to-code diff [--ui=react]
  const uiLib = args.find(a => a.startsWith('--ui='))?.split('=')[1]

  const __dir = dirname(fileURLToPath(import.meta.url))
  const pkgRoot = resolve(__dir, '../..')
  const templateDir = resolve(pkgRoot, 'template')
  const targetDir = resolve(process.cwd(), '.claude')
  const baseDst = resolve(targetDir, 'figma-base')

  // 检测当前使用的 UI 库
  let detectedUiLib = uiLib
  if (!detectedUiLib && existsSync(baseDst)) {
    // 从 components/_catalog.md 的 frontmatter 读取 uiLib
    const catalogPath = resolve(baseDst, 'components', '_catalog.md')
    if (existsSync(catalogPath)) {
      try {
        const content = readFileSync(catalogPath, 'utf-8')
        const match = content.match(/^---\n([\s\S]*?)\n---/)
        if (match) {
          const frontmatter = match[1]
          const uiLibMatch = frontmatter.match(/uiLib:\s*(\S+)/)
          if (uiLibMatch) detectedUiLib = uiLibMatch[1]
        }
      } catch { /* ignore */ }
    }
  }

  if (!detectedUiLib) {
    console.error('✖ 无法检测当前 UI 库，请使用 --ui=<name> 指定')
    console.error('  例如: figma-to-code diff --ui=react')
    process.exit(1)
  }

  // 检查 uiLib 模板目录是否存在
  const uiLibSrc = resolve(templateDir, detectedUiLib)
  if (!existsSync(uiLibSrc)) {
    console.error(`✖ 未找到 ${detectedUiLib} 模板`)
    process.exit(1)
  }

  // 读取当前版本
  let currentVersion = '未安装'
  const currentVersionFile = resolve(baseDst, 'version.txt')
  if (existsSync(currentVersionFile)) {
    currentVersion = readFileSync(currentVersionFile, 'utf-8').trim()
  }

  // 读取新版本
  const newVersionFile = resolve(uiLibSrc, 'version.txt')
  const newVersion = existsSync(newVersionFile) ? readFileSync(newVersionFile, 'utf-8').trim() : 'unknown'

  console.log(`figma-base 版本对比（${detectedUiLib}）：`)
  console.log(`  当前版本: ${currentVersion}`)
  console.log(`  最新版本: ${newVersion}`)

  if (currentVersion === newVersion) {
    console.log('\n✔ 已是最新版本')
  } else if (currentVersion === '未安装') {
    console.log('\n⚠ 未安装 figma-base，运行 figma-to-code init --ui=' + detectedUiLib + ' 初始化')
  } else {
    console.log('\n⚠ 有可用更新，运行 figma-to-code update 更新')
  }
  process.exit(0)
}

// ── --version / --help ────────────────────────────────────────────────────

if (args.includes('--version') || args.includes('-v')) {
  const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  console.log(pkg.version)
  process.exit(0)
}

// ── 骨架生成 ───────────────────────────────────────────────────────────────

const url = args.find(a => a.startsWith('http'))
const framework = (args.find(a => a.startsWith('--framework='))?.split('=')[1] ?? 'vue') as 'vue' | 'html' | 'react'

// 样式模式：支持 auto 自动检测
let styleFormat: 'unocss' | 'css' | 'inline'
const styleArg = args.find(a => a.startsWith('--style='))?.split('=')[1]
if (styleArg && styleArg !== 'auto') {
  styleFormat = styleArg as 'unocss' | 'css' | 'inline'
} else {
  const detected = detectStyleMode()
  styleFormat = detected.mode
  console.error(`[figma-to-code] ${detected.reason}，使用 ${detected.mode} 模式`)
}

// INSTANCE 折叠前缀配置：CLI 参数 > core.md frontmatter > 无配置（结构兜底）
let foldPrefixes: string[] | undefined
let noFoldPrefixes: string[] | undefined

// 1. 读取 .claude/figma-base/core.md 或 .claude/rules-base/core.md 的 frontmatter
const coreMdPaths = [
  resolve(process.cwd(), '.claude/figma-base/core.md'),
  resolve(process.cwd(), '.claude/rules-base/core.md'),
]
for (const coreMdPath of coreMdPaths) {
  if (existsSync(coreMdPath)) {
    try {
      const content = readFileSync(coreMdPath, 'utf-8')
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1]
        // 解析 YAML frontmatter 中的 foldPrefixes 和 noFoldPrefixes
        const foldMatch = frontmatter.match(/foldPrefixes:\s*\[(.*?)\]/)
        const noFoldMatch = frontmatter.match(/noFoldPrefixes:\s*\[(.*?)\]/)
        if (foldMatch) {
          foldPrefixes = foldMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean)
        }
        if (noFoldMatch) {
          noFoldPrefixes = noFoldMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean)
        }
        if (foldPrefixes?.length || noFoldPrefixes?.length) {
          console.error(`[figma-to-code] 读取 ${coreMdPath.replace(process.cwd(), '.')} 折叠配置`)
        }
      }
    } catch {
      // 解析失败，忽略
    }
    break
  }
}

// 2. CLI 参数覆盖配置
const foldPrefixesArg = args.find(a => a.startsWith('--fold-prefixes='))?.split('=')[1]
if (foldPrefixesArg) {
  foldPrefixes = foldPrefixesArg.split(',').map(p => p.trim()).filter(Boolean)
}
const noFoldPrefixesArg = args.find(a => a.startsWith('--no-fold-prefixes='))?.split('=')[1]
if (noFoldPrefixesArg) {
  noFoldPrefixes = noFoldPrefixesArg.split(',').map(p => p.trim()).filter(Boolean)
}

// 可选 token 映射。默认关闭；使用者可在 tokens/<name>.json 中提供映射。
const tokensArg = args.find(a => a.startsWith('--tokens='))?.split('=')[1] ?? 'none'
let preloadedTokenMap: Map<string, string> | undefined
const __dir = dirname(fileURLToPath(import.meta.url))
const tokenFilePath = resolve(__dir, `../../tokens/${tokensArg}.json`)
if (existsSync(tokenFilePath)) {
  try {
    const tokenData = JSON.parse(readFileSync(tokenFilePath, 'utf-8')) as Record<string, string | { name: string; value?: string }>
    preloadedTokenMap = new Map()
    let forwardCount = 0
    let reverseCount = 0
    for (const [id, entry] of Object.entries(tokenData)) {
      if (typeof entry === 'string') {
        preloadedTokenMap.set(id, entry)
        forwardCount++
      } else if (entry && typeof entry === 'object' && entry.name) {
        preloadedTokenMap.set(id, entry.name)
        forwardCount++
        if (entry.value) {
          const norm = normalizeHexKey(entry.value)
          if (norm) {
            preloadedTokenMap.set(norm, entry.name)
            reverseCount++
          }
        }
      }
    }
    const reverseLabel = reverseCount > 0 ? ` (含 ${reverseCount} 条 hex 反向)` : ''
    console.error(`[figma-to-code] 加载 ${tokensArg} token 映射: ${forwardCount} 个${reverseLabel}`)
  } catch {
    console.error(`[figma-to-code] 加载 token 映射失败: ${tokenFilePath}`)
  }
} else if (tokensArg !== 'none') {
  console.error(`[figma-to-code] token 映射文件不存在: ${tokenFilePath}，使用原始色值`)
}

/** "#fff" / "#FFFFFF" / "#ffffffff" → "#rrggbb"(小写,8 位含 alpha 不参与反查) */
function normalizeHexKey(hex: string): string | null {
  const m = hex.trim().match(/^#([0-9a-fA-F]+)$/)
  if (!m) return null
  let h = m[1].toLowerCase()
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (h.length === 6) return `#${h}`
  // 8 位带 alpha 的 token 比较少见;有需要再扩
  return null
}

if (!url) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('figma-to-code — Figma 设计稿骨架提取工具\n')
  }
  console.log('用法：')
  console.log('  figma-to-code init [--ui=react] [--force] 初始化 Claude command、Codex skill 和项目规则')
  console.log('  figma-to-code update [--ui=react]        更新 figma-base 组件规则（保留项目配置）')
  console.log('  figma-to-code diff [--ui=react]          对比 figma-base 版本')
  console.log('  figma-to-code <figma-url> [选项]         生成骨架并输出到 stdout\n')
  console.log('选项：')
  console.log('  --framework=vue|html|react        输出框架，默认 vue')
  console.log('  --style=auto|unocss|css|inline    样式格式，默认 auto（自动检测）')
  console.log('  --tokens=<name>|none              可选 token 映射，默认 none')
  console.log('  --fold-prefixes=💙,📦            白名单：匹配的组件折叠（逗号分隔）')
  console.log('  --no-fold-prefixes=👻            黑名单：匹配的组件不折叠（优先级高于白名单）')
  console.log('  --skip-version-check              跳过远程版本检查（或设 FIGMA_TO_CODE_SKIP_VERSION_CHECK=1）')
  console.log('  --help, -h                        显示帮助信息')
  console.log('  --version, -v                     显示版本号')
  console.log('')
  console.log('环境变量：')
  console.log('  FIGMA_TO_CODE_AUTO_UPDATE=1        检测到新版本时自动执行 pnpm add -g 升级')
  console.log('  FIGMA_TO_CODE_SKIP_VERSION_CHECK=1 完全禁用版本检查')
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1)
}

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
  const match = url.match(/figma\.com\/(?:file|design)\/([^/?]+)/)
  if (!match) throw new Error(`无法解析 Figma URL：${url}`)
  const fileKey = match[1]
  const nodeIdParam = new URL(url).searchParams.get('node-id')
  const nodeId = nodeIdParam ? nodeIdParam.replace(/-/, ':') : undefined
  return { fileKey, nodeId }
}

let fileKey: string
let nodeId: string | undefined

try {
  const parsed = parseFigmaUrl(url)
  fileKey = parsed.fileKey
  nodeId = parsed.nodeId
} catch (e) {
  console.error(`✖ ${(e as Error).message}`)
  process.exit(1)
}

try {
  const result = await convertFigmaToCode({
    fileKey,
    nodeId,
    framework,
    styleFormat,
    foldPrefixes,
    noFoldPrefixes,
    preloadedTokenMap,
  })

  // 子组件列表输出到 stderr，供用户终端查看
  if (result.instanceComponents.length > 0) {
    console.error('\n[figma-to-code] 识别到的子组件：')
    for (const inst of result.instanceComponents) {
      console.error(`  - ${inst.name}  figma-node: ${inst.componentId}`)
    }
  }

  // 骨架代码输出到 stdout，供 Claude 读取
  console.log(result.code)
} catch (e) {
  const msg = (e as Error).message
  if (msg.includes('未找到 Figma PAT')) {
    // PAT 错误信息已包含完整引导，直接输出
    console.error(`\n✖ ${msg}`)
  } else if (msg.includes('Figma API error (403)')) {
    console.error('✖ Figma API 返回 403：Token 无权限或已过期，请重新生成')
  } else if (msg.includes('Figma API error (404)')) {
    console.error('✖ Figma API 返回 404：文件不存在或无访问权限，请检查链接')
  } else {
    console.error(`✖ ${msg}`)
  }
  maybeCheckForUpdate()
  process.exit(1)
}

maybeCheckForUpdate()

function maybeCheckForUpdate(): void {
  if (args.includes('--skip-version-check')) return
  if (process.env.FIGMA_TO_CODE_SKIP_VERSION_CHECK === '1') return
  try {
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
    const info = checkForUpdate(pkg.version)
    if (!info) return
    printUpdateBanner(info)
    if (process.env.FIGMA_TO_CODE_AUTO_UPDATE === '1') {
      runAutoUpdate(info.latest)
    }
  } catch {
    // 版本检查任何异常都不影响主流程
  }
}
