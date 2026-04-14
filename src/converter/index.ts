import type { FileResponse, Node, TypeStyle, VariableAlias } from '../api/types'
import { FigmaAPIClient } from '../api/client'

import { calculateConstraints, convertAutoLayout, type FrameNode } from './layout'
import {
  convertCornerRadius,
  convertFillsToBackgroundColor,
  convertRectangleCornerRadii,
  convertStrokesToBorder
} from './styles'
import { convertPaintToColor, type VariableMap } from './colors'
import type { Framework, StyleFormat } from './generators/types'
import { createGenerator } from './generators/generator-factory'
import { createStyleConverter } from './styles/converter-factory'
import { buildComponentTree, simplifyNode, parseI18nKey } from './tree-builder'
import { loadAnnotationMap, buildComponentClassNameMap } from './annotation'

export interface ConvertOptions {
  fileKey: string
  nodeId?: string
  client?: FigmaAPIClient
  framework?: Framework
  styleFormat?: StyleFormat
}

export interface InstanceComponent {
  name: string
  componentId: string
}

export interface ConvertResult {
  code: string
  styles: Record<string, string>
  /** 骨架中识别到的 INSTANCE 组件列表，可用于递归生成子组件 */
  instanceComponents: InstanceComponent[]
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

function convertTypeStyleToCSS(style: TypeStyle, fills?: Node['fills'], variableMap?: VariableMap): Record<string, string> {
  const css: Record<string, string> = {}

  // 文字颜色来自 fills
  if (fills && fills.length > 0) {
    const visibleFills = fills.filter(f => f.visible !== false)
    const solidFill = visibleFills.find(f => f.type === 'SOLID')
    if (solidFill) {
      const color = convertPaintToColor(solidFill, variableMap)
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
  nodeMap: Map<string, Node>,
  variableMap?: VariableMap
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
    const textStyles = node.style ? convertTypeStyleToCSS(node.style, node.fills, variableMap) : {}
    // 若 style 里没有颜色，直接从 fills 读
    if (!textStyles.color) {
      const visibleFills = (node.fills ?? []).filter(f => f.visible !== false)
      const solidFill = visibleFills.find(f => f.type === 'SOLID')
      if (solidFill) {
        const color = convertPaintToColor(solidFill, variableMap)
        if (color) textStyles.color = color
      }
    }
    Object.assign(css, textStyles)
  } else {
    const backgroundColor = convertFillsToBackgroundColor(node.fills, variableMap)
    if (backgroundColor) {
      css['background-color'] = backgroundColor
    }
  }

  const borderStyles = convertStrokesToBorder(node.strokes, node.strokeWeight, variableMap)
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

  // 应用节点级 Variable 绑定（间距、圆角）
  if (variableMap && node.boundVariables) {
    const bv = node.boundVariables as Record<string, VariableAlias>
    if (bv.itemSpacing && css.gap) {
      const varName = variableMap.get(bv.itemSpacing.id)
      if (varName) css.gap = `var(${varName},${css.gap})`
    }
    if (bv.cornerRadius && css['border-radius']) {
      const varName = variableMap.get(bv.cornerRadius.id)
      if (varName) css['border-radius'] = `var(${varName},${css['border-radius']})`
    }
  }

  return css
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
    pluginData: 'shared'
  })

  console.error('[figma-to-code] 文件数据获取完成')

  const nodeMap = buildNodeMap([fileData.document])

  let targetNode: Node | undefined

  if (options.nodeId) {
    targetNode = findNodeById([fileData.document], options.nodeId) || undefined
    if (!targetNode) {
      // ids 参数可能导致节点不在返回的子树中（如组件库中的 componentId），
      // 尝试不带 ids 重新获取完整文件
      console.error(`[figma-to-code] 节点 ${options.nodeId} 未在子树中找到，尝试获取完整文件...`)
      const fullFileData = await client.getFile(options.fileKey, { pluginData: 'shared' })
      targetNode = findNodeById([fullFileData.document], options.nodeId) || undefined
      if (targetNode) {
        // 用完整文件重建 nodeMap
        const fullNodeMap = buildNodeMap([fullFileData.document])
        Object.assign(nodeMap, fullNodeMap)
      } else {
        throw new Error(`Node with id ${options.nodeId} not found（该节点可能在外部组件库中，无法直接获取）`)
      }
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

  console.error(`[figma-to-code] 节点: ${targetNode.name} (${targetNode.type})`)

  const framework = options.framework ?? 'html'
  const styleFormat = options.styleFormat ?? 'css'

  const generator = createGenerator(framework)
  const styleConverter = createStyleConverter(styleFormat)

  // 构建 Variable ID → CSS 变量名映射（失败时静默降级）
  let variableMap: VariableMap | undefined
  try {
    const variablesData = await client.getVariables(options.fileKey)
    const variables = variablesData.meta?.variables
    if (variables && Object.keys(variables).length > 0) {
      variableMap = new Map()
      for (const [id, variable] of Object.entries(variables)) {
        // 优先使用 Figma 设置的 codeSyntax.WEB，否则从 name 派生
        const cssVarName = (variable.codeSyntax as Record<string, string> | undefined)?.WEB
          ?? `--${variable.name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()}`
        variableMap.set(id, cssVarName)
      }
    }
  } catch {
    // Variables API 不可用（非 Enterprise 或权限不足），正常降级
  }

  // 提取 i18n 变量映射（由 Figma 插件写入 sharedPluginData）
  let i18nMap: Map<string, string> | undefined
  try {
    const pluginData = (fileData.document as Record<string, unknown>).sharedPluginData as Record<string, Record<string, string>> | undefined
    const variableMapJson = pluginData?.i18n_variable_exporter?.variableMap
    if (variableMapJson) {
      const parsed = JSON.parse(variableMapJson) as Record<string, string>
      i18nMap = new Map(Object.entries(parsed))
      console.error(`[figma-to-code] i18n 变量映射: ${i18nMap.size} 个`)
    }
  } catch {
    // 无 i18n 插件数据，正常降级
  }

  // 组件映射：通过 annotation_config 将 componentKey → Flutter 类名
  let componentClassNameMap: Map<string, string> | undefined
  if (framework === 'flutter') {
    try {
      const annotationMap = await loadAnnotationMap('flutter')
      if (annotationMap.size > 0) {
        componentClassNameMap = buildComponentClassNameMap(fileData.components ?? {}, annotationMap)
        console.error(`[figma-to-code] 组件类名映射: ${componentClassNameMap.size} 个`)
      }
    } catch {
      // annotation_config 不可用，降级用节点名
    }
  }

  // 预处理：折叠透传容器 + INSTANCE 条件剪枝
  // 有组件映射的 INSTANCE 折叠，无映射的保留内部结构
  const mappedComponentIds = componentClassNameMap ? new Set(componentClassNameMap.keys()) : undefined
  const simplifiedNode = simplifyNode(targetNode, true, mappedComponentIds)
  const nodeMapForStyles = buildNodeMap([simplifiedNode])

  const componentTree = buildComponentTree(simplifiedNode, styleConverter, undefined, nodeMapForStyles, variableMap, i18nMap, componentClassNameMap)
  
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

    collectStyles(simplifiedNode)
  }

  // 收集骨架中所有 INSTANCE 组件，供后续递归生成
  function collectInstances(node: ComponentNode): InstanceComponent[] {
    const result: InstanceComponent[] = []
    if (node.componentId) {
      result.push({ name: node.tag, componentId: node.componentId })
    }
    for (const child of node.children ?? []) {
      result.push(...collectInstances(child))
    }
    return result
  }

  const instanceComponents = collectInstances(componentTree)
  const code = generator.generate(componentTree, styles)
  console.error(`[figma-to-code] 骨架生成完成，共 ${instanceComponents.length} 个子组件`)

  return {
    code,
    styles,
    instanceComponents
  }
}
