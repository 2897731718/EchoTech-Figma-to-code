#!/usr/bin/env node
/**
 * 从 Figma 导出的 tokens.json 生成 variableId → CSS 变量名 映射
 *
 * 用法：node scripts/generate-token-map.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKENS_SOURCE_DIR = '/Users/popo/Documents/feiShuDown/01 tokens'
const TOKENS_OUTPUT_DIR = join(__dirname, '../tokens')

// 产品目录映射
const PRODUCTS = {
  'product-a': '00 product-a',
  'product-b': '01 product-b',
  'product-c': '02 product-c',
  'product-d': '03 product-d'
}

// 产品对应的 tokens.json 文件名
const TOKEN_FILES = {
  'product-a': 'Product A.tokens.json',
  'product-b': 'Product B.tokens.json',
  'product-c': 'Product C.tokens.json',
  'product-d': 'Product D.tokens.json'
}

/**
 * 递归提取 variableId → { name, value } 映射
 *
 * 输出 schema:
 *   { "VariableID:xxx": { "name": "--bg-1", "value": "#f7f7f9" } }
 *
 * 颜色 token 才会带 value(用于 colors.ts 的 hex 反向匹配);非颜色 token 仅 name。
 */
function extractVariableMap(obj, prefix = '') {
  const map = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue // 跳过 $type, $value 等元数据

    const tokenPath = prefix ? `${prefix}-${key}` : key

    if (value && typeof value === 'object') {
      // 检查是否有 variableId
      const variableId = value.$extensions?.['com.figma.variableId']
      if (variableId) {
        // 转换为 CSS 变量名：text/1 → --text-1
        const cssVarName = `--${tokenPath.replace(/\//g, '-').toLowerCase()}`
        const entry = { name: cssVarName }
        // 颜色 token($type === 'color',$value 是 #rrggbb 字符串)带值,供反向匹配
        const hex = extractHexValue(value)
        if (hex) entry.value = hex
        map[variableId] = entry
      }

      // 递归处理子对象
      const childMap = extractVariableMap(value, tokenPath)
      Object.assign(map, childMap)
    }
  }

  return map
}

/** 从 token 节点抽取颜色字符串。仅在 $type 是 color 且 $value 形如 #rrggbb 时返回。 */
function extractHexValue(node) {
  const type = node.$type
  const val = node.$value
  if (type !== 'color' || typeof val !== 'string') return null
  // Figma DTCG 输出常见为 "#RRGGBB" 或 "#RRGGBBAA";reference 形式 "{path}" 不参与反查
  const m = val.trim().match(/^#([0-9a-fA-F]{6,8})$/)
  if (!m) return null
  return `#${m[1].slice(0, 6).toLowerCase()}`
}

/**
 * 处理单个产品的 token 文件
 */
function processProduct(productKey) {
  const sourceDir = join(TOKENS_SOURCE_DIR, PRODUCTS[productKey])
  const tokenFile = join(sourceDir, TOKEN_FILES[productKey])

  console.log(`处理 ${productKey}: ${tokenFile}`)

  try {
    const content = readFileSync(tokenFile, 'utf-8')
    const tokens = JSON.parse(content)
    const variableMap = extractVariableMap(tokens)

    const outputFile = join(TOKENS_OUTPUT_DIR, `${productKey}.json`)
    writeFileSync(outputFile, JSON.stringify(variableMap, null, 2))

    console.log(`  ✔ 生成 ${Object.keys(variableMap).length} 个映射 → ${outputFile}`)
    return variableMap
  } catch (e) {
    console.error(`  ✖ 失败: ${e.message}`)
    return {}
  }
}

// 处理所有产品
console.log('生成 token 映射...\n')

for (const productKey of Object.keys(PRODUCTS)) {
  processProduct(productKey)
}

console.log('\n完成！')
