#!/usr/bin/env node
/**
 * figma-to-code CLI
 *
 * 用法：
 *   figma-to-code init                    初始化项目 skill 文件
 *   figma-to-code <figma-url> [选项]      生成骨架并输出到 stdout
 *
 * 选项：
 *   --framework=vue|html|react|flutter  默认 vue
 *   --style=auto|unocss|css|inline      默认 auto（自动检测项目技术栈）
 *   --fold-prefixes=💙                  白名单：匹配的组件折叠
 *   --no-fold-prefixes=👻               黑名单：匹配的组件不折叠
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { convertFigmaToCode, FigmaAPIClient, readFigmaPAT } from '../src/index'
import { checkForUpdate, printUpdateBanner, runAutoUpdate } from '../src/version-check'
import { findProjectReferenceFiles } from '../src/project-references'
import {
  CONVENTIONS_RELATIVE_PATH,
  CONVENTIONS_TEMPLATE_NAME,
  CURRENT_MARKER_VERSION,
  resolveConventionsPath,
  validateConventions,
  calibrate,
} from '../src/flutter-conventions'

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
 * 把 .figma-to-code/ 加入项目 .gitignore（幂等）。
 * 骨架文件落盘后是长期中间产物,需要避免被误 commit;
 * 截图虽然走 skill 第八步主动清,但流程中途用户也可能 commit,所以一并保护。
 * 非 git 项目（无 .git 目录）静默跳过;有 .git 但无 .gitignore 只提示不主动建。
 */
function ensureFigmaToCodeGitignored(cwd: string): void {
  const gitignorePath = resolve(cwd, '.gitignore')
  const entry = '.figma-to-code/'
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8')
    const alreadyIgnored = content.split(/\r?\n/).some(line => {
      const t = line.trim()
      return t === entry || t === '/.figma-to-code/' || t === '.figma-to-code' || t === '/.figma-to-code'
    })
    if (alreadyIgnored) return
    const sep = content.length === 0 || content.endsWith('\n') ? '' : '\n'
    writeFileSync(gitignorePath, `${content}${sep}\n# figma-to-code 骨架/参考图 中间产物\n${entry}\n`)
    console.error('[figma-to-code] 已追加 .figma-to-code/ 到 .gitignore')
  } else if (existsSync(resolve(cwd, '.git'))) {
    console.error('[figma-to-code] ⚠ 项目无 .gitignore，建议手动加一行 .figma-to-code/ 避免中间产物入库')
  }
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

// ── 交互式 prompt 工具（仅 TTY 下使用） ──────────────────────────────────────
async function promptYesNo(question: string, defaultYes = false): Promise<boolean> {
  if (!stdin.isTTY) return defaultYes
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const ans = (await rl.question(`${question} ${defaultYes ? '[Y/n]' : '[y/N]'}: `)).trim().toLowerCase()
    if (ans === '') return defaultYes
    return ans === 'y' || ans === 'yes'
  } finally {
    rl.close()
  }
}

async function promptText(question: string): Promise<string> {
  if (!stdin.isTTY) return ''
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    return (await rl.question(`${question}: `)).trim()
  } finally {
    rl.close()
  }
}

if (command === 'init') {
  // figma-to-code init [--ui=your-ui-lib|custom-flutter] [--bind=<path>] [--force] [--use-default] [--skip-check]
  const uiLib = args.find(a => a.startsWith('--ui='))?.split('=')[1]
  const bindPath = args.find(a => a.startsWith('--bind='))?.split('=')[1]
  const force = args.includes('--force')
  const useDefault = args.includes('--use-default')
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

  // ── custom-flutter 走独立的"规范文件"流程（不复制 figma-context.md / skill / figma-base） ──
  if (uiLib === 'custom-flutter') {
    const conventionsDst = resolveConventionsPath(process.cwd())

    // 1) 文件已存在 → 决定是否覆盖
    if (existsSync(conventionsDst)) {
      let shouldOverwrite = force
      if (!shouldOverwrite) {
        if (!stdin.isTTY) {
          console.log(`⚠ ${CONVENTIONS_RELATIVE_PATH} 已存在，跳过创建`)
          console.log('  如需覆盖（适用于升级老版本规范）：figma-to-code init --ui=custom-flutter --force')
          maybeCheckForUpdate()
          process.exit(0)
        }
        console.log(`⚠ ${CONVENTIONS_RELATIVE_PATH} 已存在`)
        console.log('  覆盖会丢失任何手动编辑（建议先 git commit 当前内容）')
        shouldOverwrite = await promptYesNo('  覆盖现有规范文件？', false)
        if (!shouldOverwrite) {
          console.log('  已取消，未做修改')
          maybeCheckForUpdate()
          process.exit(0)
        }
      }
    }

    // 2) 决定规范来源：--bind > --use-default > 交互式询问 > 默认Product A
    let source: 'bind' | 'default' = 'default'
    let resolvedBind = bindPath
    if (bindPath) {
      source = 'bind'
    } else if (!useDefault && stdin.isTTY) {
      // 交互式：问用户有没有自己的规范文件
      const hasOwn = await promptYesNo('  你的项目是否已有 UI 代码规范文件 (.md)？', false)
      if (hasOwn) {
        const p = await promptText('  请输入规范文件相对/绝对路径')
        if (p) {
          resolvedBind = p
          source = 'bind'
        } else {
          console.log('  路径为空，改用Product A默认模板')
        }
      }
    }

    // 3) 写入规范文件
    if (source === 'bind' && resolvedBind) {
      const bindAbs = resolve(process.cwd(), resolvedBind)
      if (!existsSync(bindAbs)) {
        console.error(`✖ 指定的规范文件不存在：${bindAbs}`)
        process.exit(1)
      }
      copyFileSync(bindAbs, conventionsDst)
      console.log(`✔ 已绑定规范文件：${resolvedBind} → ${CONVENTIONS_RELATIVE_PATH}`)
    } else {
      const tplSrc = resolve(templateDir, CONVENTIONS_TEMPLATE_NAME)
      if (!existsSync(tplSrc)) {
        console.error(`✖ 未找到规范模板：${tplSrc}`)
        process.exit(1)
      }
      copyFileSync(tplSrc, conventionsDst)
      console.log(`✔ 已写入 ${CONVENTIONS_RELATIVE_PATH}（Product A默认模板）`)
    }

    // 4) 校验必备章节（仅警告，不阻断）
    const v = validateConventions(process.cwd())
    if (v.missingSections.length > 0) {
      console.log(`\n⚠ 规范文件缺少以下章节，请手动补齐：`)
      for (const s of v.missingSections) console.log(`    ${s}`)
    }

    // 5) 自动跑一次 calibrate
    console.log('\n🔍 校准规范文件（扫描项目代码）...')
    try {
      const outcome = calibrate({ cwd: process.cwd() })
      console.log(`  扫描 ${outcome.filesScanned} 个 .dart 文件`)
      if (outcome.applied.length > 0) {
        console.log(`  ✔ 已自动填充 ${outcome.applied.length} 项：`)
        for (const a of outcome.applied) console.log(`    - ${a.field} → ${a.value}`)
      }
      if (outcome.remaining.length > 0) {
        console.log(`  ⚠ 仍有 ${outcome.remaining.length} 项 TODO 需手动填写：`)
        for (const r of outcome.remaining) console.log(`    - L${r.line}: ${r.field}`)
      }
      if (outcome.applied.length > 0) {
        console.log(`\n  请运行 \`git diff ${CONVENTIONS_RELATIVE_PATH}\` 确认改动`)
      }
    } catch (e) {
      console.error(`  ✖ 校准失败：${(e as Error).message}`)
    }

    // 6) 复制 /figma-flutter slash command
    {
      const skillSrc = resolve(templateDir, 'commands/figma-flutter.md')
      const skillDst = resolve(commandsDir, 'figma-flutter.md')
      if (existsSync(skillSrc)) {
        const existed = existsSync(skillDst)
        if (existed && !force) {
          console.log('⚠ .claude/commands/figma-flutter.md 已存在，跳过（升级用 --force 覆盖）')
        } else {
          copyFileSync(skillSrc, skillDst)
          console.log(`${existed ? '✔ 已更新' : '✔ 已创建'} .claude/commands/figma-flutter.md`)
        }
      }
    }

    console.log('\n✅ 安装完成！\n')
    console.log('使用方式：')
    console.log('  /figma-flutter <figma-url>                      生成 Flutter Widget（推荐，会读规范+截图对账）')
    console.log('  figma-to-code <figma-url> --framework=flutter --image   只生成骨架+参考截图')
    console.log(`  figma-to-code calibrate                         重新校准 ${CONVENTIONS_RELATIVE_PATH}`)
    console.log(`  figma-to-code init --ui=custom-flutter --force    覆盖现有规范文件 + skill（升级老版本时用）`)
    console.log('')
    console.log(`组件映射通过远程配置自动加载；翻译规范见 ${CONVENTIONS_RELATIVE_PATH}。`)
    maybeCheckForUpdate()
    process.exit(0)
  }

  // 复制 skill 文件（仅 Web 端，Flutter 端不再需要 skill）
  {
    const skillSrc = resolve(templateDir, 'commands/figma.md')
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

  // 复制 figma-base 目录（按需加载的组件规则）
  // 结构：先复制 base/ 基础模板，再合并 {uiLib}/ 特有规则
  {
    const baseDst = resolve(targetDir, 'figma-base')
    if (existsSync(baseDst)) {
      console.log('⚠ .claude/figma-base/ 已存在，跳过（使用 figma-to-code update 更新）')
    } else {
      // 1. 先复制 base/ 基础模板
      const baseSrc = resolve(templateDir, 'base')
      if (existsSync(baseSrc)) {
        mkdirSync(baseDst, { recursive: true })
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

  // 选择 context 模板（已废弃，改为直接使用 figma-base 目录结构）
  // 2026-05: figma-context.md 已拆分为 figma-base/ 下的多个文件
  // 保留此段代码以便旧版本平滑过渡，若目标目录无 figma-context.md 也不报错

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
  console.log('  /figma <figma-url>               生成代码')
  console.log('  编辑 .claude/figma-base/ 下的规范文件（如需更新请运行 figma-to-code update）')
  maybeCheckForUpdate()
  process.exit(0)
}

// ── update 子命令 ────────────────────────────────────────────────────────────

if (command === 'update') {
  // figma-to-code update [--ui=your-ui-lib]
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
    console.error('  例如: figma-to-code update --ui=your-ui-lib')
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
  // figma-to-code diff [--ui=your-ui-lib]
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
    console.error('  例如: figma-to-code diff --ui=your-ui-lib')
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

// ── calibrate 子命令 ─────────────────────────────────────────────────────

if (command === 'calibrate') {
  // figma-to-code calibrate [--dry-run]
  const dryRun = args.includes('--dry-run')
  const v = validateConventions(process.cwd())
  if (!v.exists) {
    console.error(`✖ 未找到规范文件：${CONVENTIONS_RELATIVE_PATH}`)
    console.error(`  请先运行 figma-to-code init --ui=custom-flutter`)
    process.exit(1)
  }
  if (!v.hasMarker) {
    console.error(`⚠ 当前 ${CONVENTIONS_RELATIVE_PATH} 缺少 figma-to-code 标记，可能不是合法的规范文件`)
  }
  if (v.missingSections.length > 0) {
    console.error(`⚠ 规范文件缺少章节：${v.missingSections.join('、')}`)
  }

  console.log(`🔍 校准规范文件${dryRun ? '（dry-run，不写入）' : ''}...`)
  try {
    const outcome = calibrate({ cwd: process.cwd(), dryRun })
    console.log(`  扫描 ${outcome.filesScanned} 个 .dart 文件`)
    if (outcome.applied.length > 0) {
      console.log(`  ✔ ${dryRun ? '将填充' : '已填充'} ${outcome.applied.length} 项：`)
      for (const a of outcome.applied) console.log(`    - ${a.field} → ${a.value}`)
    } else {
      console.log('  （无可自动填充字段）')
    }
    if (outcome.remaining.length > 0) {
      console.log(`  ⚠ 仍有 ${outcome.remaining.length} 项需手动填写：`)
      for (const r of outcome.remaining) console.log(`    - L${r.line}: ${r.field}`)
    }
    if (!dryRun && outcome.applied.length > 0) {
      console.log(`\n  请运行 \`git diff ${CONVENTIONS_RELATIVE_PATH}\` 确认改动`)
    }
  } catch (e) {
    console.error(`✖ ${(e as Error).message}`)
    process.exit(1)
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

// Token 映射：支持 product-a/product-b/product-c/product-d，默认 product-a
//
// JSON 支持两种 schema(并存,按 entry 自动识别):
//   旧:  { "VariableID:xxx": "--bg-1" }                       —— 仅正向(boundVariables 命中时用)
//   新:  { "VariableID:xxx": { "name": "--bg-1", "value": "#f7f7f9" } }
//                                                              —— 正向 + 反向(设计稿没绑变量时按 hex 反查)
// 反向条目以 "#rrggbb"(小写)为键塞进同一个 Map,与 "VariableID:" 键不会撞;
// 同 hex 多 token 时,最后一条覆盖。
const tokensArg = args.find(a => a.startsWith('--tokens='))?.split('=')[1] ?? 'product-a'
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
  console.log('  figma-to-code init [--ui=your-ui-lib]          初始化项目 skill 文件')
  console.log('  figma-to-code init --ui=custom-flutter [--bind=<path>] [--force] [--use-default]')
  console.log('                                              初始化 Flutter 规范文件（交互式询问）')
  console.log('                                              --bind=<path>  绑定已有规范文件')
  console.log('                                              --use-default  非交互，直接用Product A默认模板')
  console.log('                                              --force        覆盖已存在的规范文件（升级老版本时用）')
  console.log('  figma-to-code calibrate [--dry-run]        重新校准 .claude/flutter-conventions.md')
  console.log('  figma-to-code update [--ui=your-ui-lib]        更新 figma-base 组件规则（保留项目配置）')
  console.log('  figma-to-code diff [--ui=your-ui-lib]          对比 figma-base 版本')
  console.log('  figma-to-code <figma-url> [选项]           生成骨架并输出到 stdout\n')
  console.log('选项：')
  console.log('  --framework=vue|html|react|flutter   输出框架，默认 vue')
  console.log('  --style=auto|unocss|css|inline       样式格式，默认 auto（自动检测，flutter 时自动忽略）')
  console.log('  --tokens=product-a|product-b|product-c|product-d  token 映射，默认 product-a')
  console.log('  --fold-prefixes=💙,📦               白名单：匹配的组件折叠（逗号分隔）')
  console.log('  --no-fold-prefixes=👻               黑名单：匹配的组件不折叠（优先级高于白名单）')
  console.log('  --image                              （仅 flutter）额外导出节点渲染图到 .figma-to-code/，')
  console.log('                                       骨架头部会要求 IDE AI 读图对账还原度（改老页面尤其有用）')
  console.log('  --skip-version-check                 跳过远程版本检查（或设 FIGMA_TO_CODE_SKIP_VERSION_CHECK=1）')
  console.log('  --help, -h                   显示帮助信息')
  console.log('  --version, -v                显示版本号')
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

// ── Flutter runtime 检查：规范文件存在性 ──
let flutterConventionsFile: string | undefined
if (framework === 'flutter') {
  const v = validateConventions(process.cwd())
  if (!v.exists) {
    console.error(`\n✖ 未找到 Flutter 规范文件：${CONVENTIONS_RELATIVE_PATH}`)
    console.error('  团队规范要求生成 Flutter 代码必须先建立项目级规范契约。')
    console.error('  请运行其中之一：')
    console.error('    figma-to-code init --ui=custom-flutter                    # 创建Product A默认模板')
    console.error('    figma-to-code init --ui=custom-flutter --bind=<your.md>   # 绑定已有规范文件')
    process.exit(1)
  }
  flutterConventionsFile = CONVENTIONS_RELATIVE_PATH
  if (v.isOutdated) {
    console.error('')
    console.error(`[figma-to-code] ⚠ 规范文件版本过期 (${v.markerVersion} → 最新 ${CURRENT_MARKER_VERSION})`)
    console.error(`[figma-to-code]   团队Product A模板已更新，旧版本内容（如错误的命名空间）会让 AI 翻译跑偏。`)
    console.error(`[figma-to-code]   建议升级：figma-to-code init --ui=custom-flutter --force`)
    console.error(`[figma-to-code]   （会覆盖 ${CONVENTIONS_RELATIVE_PATH}，覆盖前请 git commit 当前内容）`)
    console.error('')
  }
  if (v.missingSections.length > 0) {
    console.error(`[figma-to-code] ⚠ 规范文件缺少章节：${v.missingSections.join('、')}`)
  }
  if (v.pendingTodos.length > 0) {
    console.error(`[figma-to-code] ⚠ 规范文件仍有 ${v.pendingTodos.length} 项 TODO 占位未填写：`)
    for (const t of v.pendingTodos) console.error(`    L${t.line}: ${t.context}`)
    console.error(`[figma-to-code]   建议运行 figma-to-code calibrate 自动填充，或手动编辑后保存`)
  }
}

// ── --image：导出节点渲染图（仅 Flutter）──
const wantImage = args.includes('--image')
let sharedClient: FigmaAPIClient | undefined
let flutterReferenceImage: string | undefined
if (wantImage) {
  if (framework !== 'flutter') {
    console.error('[figma-to-code] --image 目前仅对 --framework=flutter 生效，已忽略')
  } else if (!nodeId) {
    console.error('[figma-to-code] --image 需要 URL 带 node-id 才能定位要渲染的节点，已跳过')
  } else {
    try {
      sharedClient = new FigmaAPIClient(await readFigmaPAT())
      const imgRes = await sharedClient.getImages(fileKey, [nodeId], { format: 'png', scale: 2 })
      const imgUrl = imgRes.images[nodeId]
      if (!imgUrl) {
        console.error(`[figma-to-code] ⚠ 渲染图导出失败（images API 未返回 URL${imgRes.err ? `：${imgRes.err}` : ''}），跳过`)
      } else {
        const resp = await fetch(imgUrl)
        if (!resp.ok) throw new Error(`下载渲染图失败 HTTP ${resp.status}`)
        const buf = Buffer.from(await resp.arrayBuffer())
        const dir = resolve(process.cwd(), '.figma-to-code')
        mkdirSync(dir, { recursive: true })
        ensureFigmaToCodeGitignored(process.cwd())
        const filePath = join(dir, `${nodeId.replace(/:/g, '-')}.png`)
        writeFileSync(filePath, buf)
        flutterReferenceImage = relative(process.cwd(), filePath)
        console.error(`[figma-to-code] 参考截图已保存: ${flutterReferenceImage} (${(buf.length / 1024).toFixed(0)} KB)`)
      }
    } catch (e) {
      console.error(`[figma-to-code] ⚠ 渲染图导出失败：${(e as Error).message?.slice(0, 100)}，跳过（不影响骨架生成）`)
    }
  }
}

try {
  const projectReferenceFiles = framework === 'flutter' ? findProjectReferenceFiles() : undefined
  const result = await convertFigmaToCode({
    fileKey,
    nodeId,
    framework,
    styleFormat,
    foldPrefixes,
    noFoldPrefixes,
    preloadedTokenMap,
    projectReferenceFiles,
    flutterConventionsFile,
    flutterReferenceImage,
    client: sharedClient,
  })

  // 子组件列表输出到 stderr，供用户终端查看
  if (result.instanceComponents.length > 0) {
    console.error('\n[figma-to-code] 识别到的子组件：')
    for (const inst of result.instanceComponents) {
      console.error(`  - ${inst.name}  figma-node: ${inst.componentId}`)
    }
  }

  // Flutter 模式 + 有 nodeId 时,骨架同时落盘到 .figma-to-code/skeleton-<nodeId>.dart,
  // 供 /figma-flutter --fix <dart-path> 二次修正、用户要求"彻底重写"时反查原 url 用 ——
  // CLI 本身无状态,这份落盘文件是唯一中间产物钩子。
  //
  // 文件头部 prepend 三行元数据(figma-url / node-id / 时间戳),只写到落盘文件,
  // 不污染 stdout (stdout 给 IDE AI 走翻译流程,翻译产物里不该带原始 url)。
  if (framework === 'flutter' && nodeId) {
    try {
      const dir = resolve(process.cwd(), '.figma-to-code')
      mkdirSync(dir, { recursive: true })
      ensureFigmaToCodeGitignored(process.cwd())
      const skeletonPath = join(dir, `skeleton-${nodeId.replace(/:/g, '-')}.dart`)
      const meta = [
        `// figma-url: ${url}`,
        `// figma-node-id: ${nodeId}`,
        `// generated-at: ${new Date().toISOString()}`,
        '',
      ].join('\n')
      writeFileSync(skeletonPath, meta + result.code)
      console.error(`[figma-to-code] 骨架已落盘: ${relative(process.cwd(), skeletonPath)} (供 /figma-flutter --fix 二次修正用)`)
    } catch (e) {
      console.error(`[figma-to-code] ⚠ 骨架落盘失败: ${(e as Error).message?.slice(0, 100)} (不影响 stdout 产出)`)
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
