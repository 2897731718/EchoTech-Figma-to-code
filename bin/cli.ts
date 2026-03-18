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

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
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

  console.log('\n下一步：编辑 .claude/figma-context.md，补充项目的 token 和 UnoCSS 配置')
  process.exit(0)
}

// ── 骨架生成 ───────────────────────────────────────────────────────────────

const url = args.find(a => a.startsWith('http'))
const framework = (args.find(a => a.startsWith('--framework='))?.split('=')[1] ?? 'vue') as 'vue' | 'html' | 'react'
const styleFormat = (args.find(a => a.startsWith('--style='))?.split('=')[1] ?? 'unocss') as 'unocss' | 'css' | 'inline'

if (!url) {
  console.error('用法：')
  console.error('  figma-to-code init')
  console.error('  figma-to-code <figma-url> [--framework=vue] [--style=unocss]')
  process.exit(1)
}

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
  const match = url.match(/figma\.com\/(?:file|design)\/([^/?]+)/)
  if (!match) throw new Error(`无法解析 Figma URL：${url}`)
  const fileKey = match[1]
  const nodeIdParam = new URL(url).searchParams.get('node-id')
  const nodeId = nodeIdParam ? nodeIdParam.replace(/-/, ':') : undefined
  return { fileKey, nodeId }
}

const { fileKey, nodeId } = parseFigmaUrl(url)

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
