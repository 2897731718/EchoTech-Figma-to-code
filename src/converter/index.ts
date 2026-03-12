import type { FileResponse, Node, TypeStyle, Variable, VariablesResponse } from '../api/types'
import { FigmaAPIClient } from '../api/client'

import { calculateConstraints, convertAutoLayout, type FrameNode } from './layout'
import {
  convertCornerRadius,
  convertFillsToBackgroundColor,
  convertRectangleCornerRadii,
  convertStrokesToBorder
} from './styles'
import { convertPaintToColor } from './colors'
import type { Framework, StyleFormat } from './generators/types'
import { createGenerator } from './generators/generator-factory'
import { createStyleConverter } from './styles/converter-factory'
import { buildComponentTree, simplifyNode } from './tree-builder'

export interface ConvertOptions {
  fileKey: string
  nodeId?: string
  resolveVariables?: boolean
  client?: FigmaAPIClient
  framework?: Framework
  styleFormat?: StyleFormat
}

export interface TokenValue {
  kind: 'color' | 'number' | 'string' | 'boolean'
  value: string | Record<string, string>
}

export interface ConvertResult {
  code: string
  styles: Record<string, string>
  tokens?: Record<string, TokenValue>
}

function findNodeById(nodes: Node[], nodeId: string): Node | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node
    }
    if (node.children) {
      const found = findNodeById(node.children, nodeId)
      if (found) {
        return found
      }
    }
  }
  return null
}

function buildNodeMap(nodes: Node[]): Map<string, Node> {
  const map = new Map<string, Node>()

  function traverse(node: Node) {
    map.set(node.id, node)
    if (node.children) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  for (const node of nodes) {
    traverse(node)
  }

  return map
}

function convertTypeStyleToCSS(style: TypeStyle, fills?: Node['fills']): Record<string, string> {
  const css: Record<string, string> = {}

  // 文字颜色来自 fills
  if (fills && fills.length > 0) {
    const visibleFills = fills.filter(f => f.visible !== false)
    const solidFill = visibleFills.find(f => f.type === 'SOLID')
    if (solidFill) {
      const color = convertPaintToColor(solidFill)
      if (color) css.color = color
    }
  }

  if (style.fontFamily) css['font-family'] = `"${style.fontFamily}"`
  if (style.fontSize) css['font-size'] = `${style.fontSize}px`
  if (style.fontWeight) css['font-weight'] = String(style.fontWeight)
  if (style.italic) css['font-style'] = 'italic'

  if (style.lineHeightPx && style.lineHeightUnit === 'PIXELS') {
    css['line-height'] = `${style.lineHeightPx}px`
  } else if (style.lineHeightPercentFontSize) {
    css['line-height'] = `${style.lineHeightPercentFontSize}%`
  }

  if (style.letterSpacing !== undefined) {
    const ls = style.letterSpacing
    if (typeof ls === 'number') {
      css['letter-spacing'] = `${ls}px`
    } else if (ls.unit === 'PIXELS') {
      css['letter-spacing'] = `${ls.value}px`
    } else if (ls.unit === 'PERCENT' && style.fontSize) {
      css['letter-spacing'] = `${(ls.value / 100) * style.fontSize}px`
    }
  }

  if (style.textAlignHorizontal) {
    const alignMap: Record<string, string> = {
      LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify'
    }
    const align = alignMap[style.textAlignHorizontal]
    if (align) css['text-align'] = align
  }

  if (style.textDecoration && style.textDecoration !== 'NONE') {
    css['text-decoration'] = style.textDecoration === 'UNDERLINE' ? 'underline' : 'line-through'
  }

  if (style.textCase) {
    const caseMap: Record<string, string> = {
      UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize'
    }
    const textTransform = caseMap[style.textCase]
    if (textTransform) css['text-transform'] = textTransform
  }

  return css
}

export function convertNodeToCSS(
  node: Node,
  parent: Node | undefined,
  nodeMap: Map<string, Node>
): Record<string, string> {
  const css: Record<string, string> = {}

  if (node.visible === false) {
    return css
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    css.opacity = String(node.opacity)
  }

  // TEXT 节点：fills 是文字颜色，其他节点：fills 是背景色
  if (node.type === 'TEXT') {
    const textStyles = node.style ? convertTypeStyleToCSS(node.style, node.fills) : {}
    // 若 style 里没有颜色，直接从 fills 读
    if (!textStyles.color) {
      const visibleFills = (node.fills ?? []).filter(f => f.visible !== false)
      const solidFill = visibleFills.find(f => f.type === 'SOLID')
      if (solidFill) {
        const color = convertPaintToColor(solidFill)
        if (color) textStyles.color = color
      }
    }
    Object.assign(css, textStyles)
  } else {
    const backgroundColor = convertFillsToBackgroundColor(node.fills)
    if (backgroundColor) {
      css['background-color'] = backgroundColor
    }
  }

  const borderStyles = convertStrokesToBorder(node.strokes, node.strokeWeight)
  Object.assign(css, borderStyles)

  if (node.cornerRadius !== undefined) {
    const radius = convertCornerRadius(node.cornerRadius)
    if (radius) {
      css['border-radius'] = radius
    }
  }

  if (node.rectangleCornerRadii) {
    const radii = convertRectangleCornerRadii(node.rectangleCornerRadii)
    if (radii) {
      Object.assign(css, radii)
    }
  }

  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const layoutStyles = convertAutoLayout(node as FrameNode)
    Object.assign(css, layoutStyles)
  }

  // auto-layout 流中的子节点不设置 position: absolute，除非明确标记为 ABSOLUTE
  const isInAutoLayoutFlow =
    parent &&
    (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL') &&
    node.layoutPositioning !== 'ABSOLUTE'

  if (node.constraints && parent && !isInAutoLayoutFlow) {
    const constraintStyles = calculateConstraints(node, parent)
    Object.assign(css, constraintStyles)
  }

  if (node.absoluteBoundingBox) {
    css.width = `${node.absoluteBoundingBox.width}px`
    css.height = `${node.absoluteBoundingBox.height}px`
  }

  return css
}

function generateCodeFromNode(
  node: Node,
  nodeMap: Map<string, Node>,
  depth = 0
): string {
  if (node.visible === false) {
    return ''
  }

  const indent = '  '.repeat(depth)
  const className = `node-${node.id.replace(/[:;]/g, '-')}`
  
  if (node.type === 'TEXT') {
    const content = node.characters || ''
    return `${indent}<div class="${className}">${content}</div>`
  }
  let code = `${indent}<div class="${className}">\n`

  if (node.children) {
    for (const child of node.children) {
      const childCode = generateCodeFromNode(child, nodeMap, depth + 1)
      if (childCode) {
        code += `${childCode}\n`
      }
    }
  }

  code += `${indent}</div>`
  return code
}

function extractTokens(
  variables: Record<string, Variable> | undefined
): Record<string, TokenValue> | undefined {
  if (!variables) {
    return undefined
  }

  const tokens: Record<string, TokenValue> = {}

  for (const [id, variable] of Object.entries(variables)) {
    const canonicalName = `--${variable.name.replace(/\s+/g, '-').toLowerCase()}`
    const firstModeId = Object.keys(variable.valuesByMode)[0]

    if (firstModeId) {
      const value = variable.valuesByMode[firstModeId]

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        tokens[canonicalName] = {
          kind: variable.type.toLowerCase() as 'color' | 'number' | 'string' | 'boolean',
          value: String(value)
        }
      } else if (typeof value === 'object' && 'r' in value) {
        tokens[canonicalName] = {
          kind: 'color',
          value: `rgb(${Math.round(value.r * 255)}, ${Math.round(value.g * 255)}, ${Math.round(value.b * 255)})`
        }
      } else if (typeof value === 'object' && Object.keys(variable.valuesByMode).length > 1) {
        const modeValues: Record<string, string> = {}
        for (const [modeId, modeValue] of Object.entries(variable.valuesByMode)) {
          if (typeof modeValue === 'string' || typeof modeValue === 'number') {
            modeValues[modeId] = String(modeValue)
          }
        }
        tokens[canonicalName] = {
          kind: variable.type.toLowerCase() as 'color' | 'number' | 'string' | 'boolean',
          value: modeValues
        }
      }
    }
  }

  return Object.keys(tokens).length > 0 ? tokens : undefined
}

export async function convertFigmaToCode(
  options: ConvertOptions
): Promise<ConvertResult> {
  let client = options.client
  if (!client) {
    const { readFigmaPAT } = await import('../pat/reader')
    const pat = await readFigmaPAT()
    client = new FigmaAPIClient(pat)
  }

  const fileData = await client.getFile(options.fileKey, {
    ...(options.nodeId ? { ids: [options.nodeId] } : {}),
    depth: 10
  })
  
  console.log('\n======== Figma API 原始数据 ========')
  console.log(JSON.stringify(fileData, null, 2))
  
  const nodeMap = buildNodeMap([fileData.document])

  let targetNode: Node | undefined

  if (options.nodeId) {
    targetNode = findNodeById([fileData.document], options.nodeId) || undefined
    if (!targetNode) {
      throw new Error(`Node with id ${options.nodeId} not found`)
    }
  } else {
    if (fileData.document.children && fileData.document.children.length > 0) {
      targetNode = fileData.document.children[0]
    } else {
      targetNode = fileData.document
    }
  }

  if (!targetNode) {
    throw new Error('No target node found')
  }

  console.log('\n======== 找到的目标节点 ========')
  console.log('节点 ID:', targetNode.id)
  console.log('节点名称:', targetNode.name)
  console.log('节点类型:', targetNode.type)
  console.log('子节点数量:', targetNode.children?.length ?? 0)
  console.log('节点结构:', JSON.stringify({
    id: targetNode.id,
    name: targetNode.name,
    type: targetNode.type,
    visible: targetNode.visible,
    childrenCount: targetNode.children?.length ?? 0,
    children: targetNode.children?.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      visible: c.visible
    }))
  }, null, 2))

  const framework = options.framework ?? 'html'
  const styleFormat = options.styleFormat ?? 'css'

  const generator = createGenerator(framework)
  const styleConverter = createStyleConverter(styleFormat)

  // 预处理：折叠透传容器 + INSTANCE 剪枝
  const simplifiedNode = simplifyNode(targetNode)
  const nodeMapForStyles = buildNodeMap([simplifiedNode])

  const componentTree = buildComponentTree(simplifiedNode, styleConverter, undefined, nodeMapForStyles)
  
  if (!componentTree) {
    throw new Error('Failed to build component tree')
  }

  const styles: Record<string, string> = {}

  // unocss 模式下类名已内联到模板，不需要收集 CSS
  if (styleFormat === 'css') {
    function collectStyles(node: Node, parent?: Node) {
      if (node.visible === false) return

      const className = `node-${node.id.replace(/[:;]/g, '-')}`
      const css = convertNodeToCSS(node, parent, nodeMapForStyles)

      if (Object.keys(css).length > 0) {
        styles[className] = Object.entries(css)
          .map(([key, value]) => `  ${key}: ${value};`)
          .join('\n')
      }

      if (node.children) {
        for (const child of node.children) {
          collectStyles(child, node)
        }
      }
    }

    collectStyles(targetNode)
  }

  let tokens: Record<string, TokenValue> | undefined

  if (options.resolveVariables) {
    try {
      const variablesData = await client.getVariables(options.fileKey)
      tokens = extractTokens(variablesData.meta?.variables)
    } catch {
      tokens = undefined
    }
  }

  const code = generator.generate(componentTree, styles, tokens)

  return {
    code,
    styles,
    tokens
  }
}
