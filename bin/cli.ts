#!/usr/bin/env node
/**
 * figma-to-code CLI
 *
 * 用法：
 *   figma-to-code init                    初始化项目 skill 文件
 *   figma-to-code <figma-url> [选项]      生成骨架并输出到 stdout
 *
 * 选项：
 *   --framework=vue|html|react   默认 vue
 *   --style=auto|unocss|css|inline    默认 auto（自动检测项目技术栈）
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { convertFigmaToCode } from '../src/index'

// ── 自动检测项目样式模式 ────────────────────────────────────────────────────

type StyleMode = 'unocss' | 'css' | 'inline'

interface DetectResult {
  mode: StyleMode
  reason: string
}

function detectStyleMode(cwd: string = process.cwd()): DetectResult {
  // 读取 package.json
  let pkgDeps: Record<string, string> = {}
  const pkgPath = resolve(cwd, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      pkgDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    } catch { /* ignore */ }
  }

  // 1. 检测 UnoCSS
  if (existsSync(resolve(cwd, 'uno.config.ts')) || existsSync(resolve(cwd, 'uno.config.js'))) {
    return { mode: 'unocss', reason: '检测到 uno.config.ts/js' }
  }
  if (pkgDeps['unocss']) {
    return { mode: 'unocss', reason: '检测到 unocss 依赖' }
  }

  // 2. 检测 Tailwind CSS
  if (existsSync(resolve(cwd, 'tailwind.config.js')) || existsSync(resolve(cwd, 'tailwind.config.ts'))) {
    return { mode: 'unocss', reason: '检测到 tailwind.config.js/ts' }
  }
  if (pkgDeps['tailwindcss']) {
    return { mode: 'unocss', reason: '检测到 tailwindcss 依赖' }
  }

  // 3. 检测 WindiCSS
  if (existsSync(resolve(cwd, 'windi.config.ts')) || existsSync(resolve(cwd, 'windi.config.js'))) {
    return { mode: 'unocss', reason: '检测到 windi.config.ts/js' }
  }
  if (pkgDeps['windicss']) {
    return { mode: 'unocss', reason: '检测到 windicss 依赖' }
  }

  // 4. 检测微信小程序
  if (existsSync(resolve(cwd, 'app.json')) && existsSync(resolve(cwd, 'project.config.json'))) {
    return { mode: 'inline', reason: '检测到微信小程序项目' }
  }

  // 5. 检测 Taro
  if (pkgDeps['@tarojs/taro'] || existsSync(resolve(cwd, 'config/index.js'))) {
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
  // figma-to-code init [--ui=your-ui-lib|custom-flutter] [--skip-check]
  const uiLib = args.find(a => a.startsWith('--ui='))?.split('=')[1]
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

  // 复制 skill 文件（仅 Web 端，Flutter 端不再需要 skill）
  if (uiLib !== 'custom-flutter') {
    const skillSrc = resolve(pkgRoot, '.claude/commands/figma.md')
    const skillDst = resolve(commandsDir, 'figma.md')
    if (existsSync(skillSrc)) {
      if (existsSync(skillDst)) {
        console.log('⚠ .claude/commands/figma.md 已存在，跳过')
      } else {
        copyFileSync(skillSrc, skillDst)
        console.log('✔ 已创建 .claude/commands/figma.md')
      }
    }
  }

  // 选择 context 模板
  const templateName = uiLib ? `figma-context-${uiLib}.md` : 'figma-context.md'
  const contextSrc = resolve(templateDir, templateName)
  const contextDst = resolve(targetDir, 'figma-context.md')

  if (!existsSync(contextSrc)) {
    console.error(`✖ 未找到模板：${templateName}`)
    console.error(`  可用模板：figma-context.md（通用）、figma-context-your-ui-lib.md、figma-context-custom-flutter.md`)
    process.exit(1)
  }

  if (existsSync(contextDst)) {
    console.log('⚠ .claude/figma-context.md 已存在，跳过')
  } else {
    copyFileSync(contextSrc, contextDst)
    console.log(`✔ 已创建 .claude/figma-context.md（基于 ${templateName}）`)
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

  if (uiLib === 'custom-flutter') {
    console.log('使用方式：')
    console.log('  figma-to-code <figma-url> --framework=flutter   生成 Flutter 骨架')
    console.log('')
    console.log('组件映射通过远程配置自动加载，INSTANCE 节点会标注正确的 Flutter 类名。')
  } else {
    console.log('使用方式：')
    console.log('  /figma <figma-url>               生成代码')
    console.log('  编辑 .claude/figma-context.md 补充项目的 token 和 UnoCSS 配置')
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
const framework = (args.find(a => a.startsWith('--framework='))?.split('=')[1] ?? 'vue') as 'vue' | 'html' | 'react' | 'flutter'

// 样式模式：flutter 强制 inline，其他支持 auto 自动检测
let styleFormat: 'unocss' | 'css' | 'inline'
if (framework === 'flutter') {
  styleFormat = 'inline'
} else {
  const styleArg = args.find(a => a.startsWith('--style='))?.split('=')[1]
  if (styleArg && styleArg !== 'auto') {
    styleFormat = styleArg as 'unocss' | 'css' | 'inline'
  } else {
    // auto 模式或未指定：自动检测
    const detected = detectStyleMode()
    styleFormat = detected.mode
    console.error(`[figma-to-code] ${detected.reason}，使用 ${detected.mode} 模式`)
  }
}

// Token 映射：支持 product-a/product-b/product-c/product-d，默认 product-a
const tokensArg = args.find(a => a.startsWith('--tokens='))?.split('=')[1] ?? 'product-a'
let preloadedTokenMap: Map<string, string> | undefined
const __dir = dirname(fileURLToPath(import.meta.url))
const tokenFilePath = resolve(__dir, `../../tokens/${tokensArg}.json`)
if (existsSync(tokenFilePath)) {
  try {
    const tokenData = JSON.parse(readFileSync(tokenFilePath, 'utf-8')) as Record<string, string>
    preloadedTokenMap = new Map(Object.entries(tokenData))
    console.error(`[figma-to-code] 加载 ${tokensArg} token 映射: ${preloadedTokenMap.size} 个`)
  } catch {
    console.error(`[figma-to-code] 加载 token 映射失败: ${tokenFilePath}`)
  }
} else if (tokensArg !== 'none') {
  console.error(`[figma-to-code] token 映射文件不存在: ${tokenFilePath}，使用原始色值`)
}

if (!url) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('figma-to-code — Figma 设计稿骨架提取工具\n')
  }
  console.log('用法：')
  console.log('  figma-to-code init [--ui=your-ui-lib]          初始化项目 skill 文件')
  console.log('  figma-to-code <figma-url> [选项]           生成骨架并输出到 stdout\n')
  console.log('选项：')
  console.log('  --framework=vue|html|react|flutter   输出框架，默认 vue')
  console.log('  --style=auto|unocss|css|inline       样式格式，默认 auto（自动检测）')
  console.log('  --tokens=product-a|product-b|product-c|product-d  token 映射，默认 product-a')
  console.log('  --help, -h                   显示帮助信息')
  console.log('  --version, -v                显示版本号')
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
  process.exit(1)
}
