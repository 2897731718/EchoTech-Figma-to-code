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
import { convertFigmaToCode } from '../src/index'

const args = process.argv.slice(2)
const command = args[0]

// ── init 子命令 ────────────────────────────────────────────────────────────

if (command === 'init') {
  // figma-to-code init [--ui=your-ui-lib]
  const uiLib = args.find(a => a.startsWith('--ui='))?.split('=')[1]

  const __dir = dirname(fileURLToPath(import.meta.url))
  // dist/bin/ -> 上两级到包根目录
  const pkgRoot = resolve(__dir, '../..')
  const templateDir = resolve(pkgRoot, 'template')
  const targetDir = resolve(process.cwd(), '.claude')
  const commandsDir = resolve(targetDir, 'commands')

  mkdirSync(commandsDir, { recursive: true })

  // 复制 figma.md command
  const skillSrc = resolve(pkgRoot, '.claude/commands/figma.md')
  const skillDst = resolve(commandsDir, 'figma.md')
  if (existsSync(skillDst)) {
    console.log('⚠ .claude/commands/figma.md 已存在，跳过')
  } else {
    copyFileSync(skillSrc, skillDst)
    console.log('✔ 已创建 .claude/commands/figma.md')
  }

  // 选择 context 模板
  const templateName = uiLib ? `figma-context-${uiLib}.md` : 'figma-context.md'
  const contextSrc = resolve(templateDir, templateName)
  const contextDst = resolve(targetDir, 'figma-context.md')

  if (!existsSync(contextSrc)) {
    console.error(`✖ 未找到模板：${templateName}`)
    console.error(`  可用模板：figma-context.md（通用）、figma-context-your-ui-lib.md`)
    process.exit(1)
  }

  if (existsSync(contextDst)) {
    console.log('⚠ .claude/figma-context.md 已存在，跳过')
  } else {
    copyFileSync(contextSrc, contextDst)
    console.log(`✔ 已创建 .claude/figma-context.md（基于 ${templateName}）`)
  }

  console.log('\n下一步：')
  console.log('  1. 配置 Figma PAT（首次使用需要）：')
  console.log('     security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "你的TOKEN"')
  console.log('  2. 编辑 .claude/figma-context.md，补充项目的 token 和 UnoCSS 配置')
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
const styleFormat = (args.find(a => a.startsWith('--style='))?.split('=')[1] ?? 'unocss') as 'unocss' | 'css' | 'inline'

if (!url) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('figma-to-code — Figma 设计稿骨架提取工具\n')
  }
  console.log('用法：')
  console.log('  figma-to-code init [--ui=your-ui-lib]          初始化项目 skill 文件')
  console.log('  figma-to-code <figma-url> [选项]           生成骨架并输出到 stdout\n')
  console.log('选项：')
  console.log('  --framework=vue|html|react   输出框架，默认 vue')
  console.log('  --style=unocss|css|inline    样式格式，默认 unocss')
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
