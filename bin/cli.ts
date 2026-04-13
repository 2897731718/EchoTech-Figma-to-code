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
 *   --style=unocss|css|inline    默认 unocss
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { convertFigmaToCode } from '../src/index'

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
// flutter 不使用 CSS，强制 inline
const styleFormat = framework === 'flutter'
  ? 'inline' as const
  : (args.find(a => a.startsWith('--style='))?.split('=')[1] ?? 'unocss') as 'unocss' | 'css' | 'inline'

if (!url) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('figma-to-code — Figma 设计稿骨架提取工具\n')
  }
  console.log('用法：')
  console.log('  figma-to-code init [--ui=your-ui-lib]          初始化项目 skill 文件')
  console.log('  figma-to-code <figma-url> [选项]           生成骨架并输出到 stdout\n')
  console.log('选项：')
  console.log('  --framework=vue|html|react|flutter   输出框架，默认 vue')
  console.log('  --style=unocss|css|inline            样式格式，默认 unocss（flutter 时自动忽略）')
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
