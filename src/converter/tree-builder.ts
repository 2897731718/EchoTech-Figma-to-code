import type { Node } from '../api/types'
import type { ComponentNode, StyleConverter } from './generators/types'
import type { ParsedStyles, ParsedLayout, ParsedPadding, ParsedBorderRadius, ParsedBorder, ParsedText } from './generators/style-parser'
import { convertNodeToCSS } from './index'
import { convertPaintToColor, type VariableMap } from './colors'
import { convertFillsToBackgroundColor } from './styles'
import type { FrameNode } from './layout'

// ─── 策略二：预处理 - 折叠透传容器 ────────────────────────────────────────────

/**
 * 判断节点是否为透传容器：
 * 单子节点 + 无视觉样式（无填充/描边/圆角/padding）
 */
function isPassthrough(node: Node): boolean {
  const visibleChildren = (node.children ?? []).filter(c => c.visible !== false)
  if (visibleChildren.length !== 1) return false

  const hasFills = (node.fills ?? []).some(f => f.visible !== false)
  if (hasFills) return false

  const hasStrokes = (node.strokes ?? []).some(s => s.visible !== false)
  if (hasStrokes) return false

  if ((node.cornerRadius ?? 0) > 0) return false
  if ((node.paddingTop ?? 0) > 0) return false
  if ((node.paddingRight ?? 0) > 0) return false
  if ((node.paddingBottom ?? 0) > 0) return false
  if ((node.paddingLeft ?? 0) > 0) return false

  return true
}

/**
 * 简化 Figma 节点树：
 * - 折叠透传容器（单子节点且无视觉样式）
 * - 对 INSTANCE 节点：有组件映射时折叠，无映射时保留内部结构
 */
export function simplifyNode(
  node: Node,
  isRoot = false,
  mappedComponentIds?: Set<string>
): Node {
  // 策略一：INSTANCE / 嵌套 COMPONENT 节点处理（根节点除外）
  if (!isRoot && (node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
    // 有组件映射 → 折叠（AI 知道用什么组件，不需要看内部）
    // 无映射 → 保留内部结构（AI 需要看内部来推断）
    const isMapped = node.componentId && mappedComponentIds?.has(node.componentId)
    if (isMapped) {
      return { ...node, children: [] }
    }
    // 无映射时继续递归简化子节点，不折叠
  }

  // 先递归简化 children
  const simplifiedChildren = (node.children ?? [])
    .filter(c => c.visible !== false)
    .map(c => simplifyNode(c, false, mappedComponentIds))

  const nodeWithChildren = { ...node, children: simplifiedChildren }

  // 策略二：折叠透传容器（简化后只剩一个子节点，根节点不折叠）
  if (!isRoot && simplifiedChildren.length === 1 && isPassthrough(nodeWithChildren)) {
    return simplifiedChildren[0]
  }

  return nodeWithChildren
}

// ─── 构建组件树 ───────────────────────────────────────────────────────────────

/** Variable name → i18n key: "09_Product/成交(Sold)" → "09_Product.Sold" */
export function parseI18nKey(variableName: string): string {
  const parts = variableName.split('/')
  const keyParts = parts.map(part => {
    const match = part.match(/\(([^)]+)\)$/)
    return match ? match[1] : part
  })
  return keyParts.join('.')
}

export function buildComponentTree(
  node: Node,
  styleConverter: StyleConverter,
  parent: Node | undefined,
  nodeMap: Map<string, Node>,
  variableMap?: VariableMap,
  i18nMap?: Map<string, string>,
  componentClassNameMap?: Map<string, string>
): ComponentNode | null {
  if (node.visible === false) return null

  const css = convertNodeToCSS(node, parent, nodeMap, variableMap)

  // 策略三：宽度自适应检测（先处理 CSS）
  let autoWidth = false
  if (parent && css['width'] && css['height']) {
    const parentContentWidth = getContentWidth(parent)
    const nodeWidth = node.absoluteBoundingBox?.width
    if (parentContentWidth && nodeWidth && Math.abs(nodeWidth - parentContentWidth) <= 1) {
      delete css['width']
      autoWidth = true
      if (node.type !== 'TEXT') {
        delete css['height']
      }
    }
  }

  const styleResult = styleConverter.convert(css, node.id)

  const parsed = extractParsedStyles(node, parent, variableMap)
  // 同步宽度自适应到 parsedStyles
  if (autoWidth) {
    delete parsed.width
    if (node.type !== 'TEXT') delete parsed.height
  }

  const componentNode: ComponentNode = {
    tag: getTagForNode(node, componentClassNameMap),
    nodeId: node.id,
    props: {},
    ...(node.componentId ? { componentId: node.componentId } : {}),
    parsedStyles: parsed,
    ...(node.componentProperties ? { componentProps: extractComponentProps(node.componentProperties) } : {}),
    // 语义名：INSTANCE/COMPONENT 节点保留 Figma 节点名
    ...((node.type === 'INSTANCE' || node.type === 'COMPONENT') && node.name ? { semanticName: node.name } : {}),
    // flex-1：layoutGrow=1 时标记
    ...(node.layoutGrow === 1 ? { isExpanded: true } : {})
  }

  if (styleResult.className) {
    componentNode.className = styleResult.className
  }

  if (styleResult.classes && styleResult.classes.length > 0) {
    componentNode.className = styleResult.classes.join(' ')
  }

  if (styleResult.style && Object.keys(styleResult.style).length > 0) {
    componentNode.style = styleResult.style
  }

  if (node.type === 'TEXT') {
    componentNode.text = node.characters || ''
    // i18n: 如果文本绑定了变量，解析出 i18n key
    const charBinding = (node.boundVariables as Record<string, unknown>)?.characters as { id: string } | undefined
    if (charBinding && i18nMap) {
      const variableName = i18nMap.get(charBinding.id)
      if (variableName) {
        componentNode.i18nKey = parseI18nKey(variableName)
      }
    }
  } else if (node.children && node.children.length > 0) {
    componentNode.children = []
    for (const child of node.children) {
      const childNode = buildComponentTree(child, styleConverter, node, nodeMap, variableMap, i18nMap, componentClassNameMap)
      if (childNode) {
        componentNode.children.push(childNode)
      }
    }
  }

  return componentNode
}

// ─── 从 Figma 节点直接提取结构化样式（移动端生成器使用） ─────────────────────

export function extractParsedStyles(
  node: Node,
  parent: Node | undefined,
  variableMap?: VariableMap
): ParsedStyles {
  const result: ParsedStyles = {}

  if (node.visible === false) return result

  // 透明度
  if (node.opacity !== undefined && node.opacity < 1) {
    result.opacity = node.opacity
  }

  // 布局（Auto Layout）
  const fn = node as FrameNode
  if (fn.layoutMode && fn.layoutMode !== 'NONE') {
    const layout: ParsedLayout = {
      direction: fn.layoutMode === 'VERTICAL' ? 'column' : 'row'
    }
    if (typeof fn.itemSpacing === 'number' && fn.itemSpacing > 0) {
      layout.gap = fn.itemSpacing
    }
    if (fn.primaryAxisAlignItems) {
      const map: Record<string, ParsedLayout['justify']> = {
        MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between'
      }
      layout.justify = map[fn.primaryAxisAlignItems]
    }
    if (fn.counterAxisAlignItems) {
      const map: Record<string, ParsedLayout['align']> = {
        MIN: 'start', CENTER: 'center', MAX: 'end', BASELINE: 'baseline'
      }
      layout.align = map[fn.counterAxisAlignItems]
    }
    result.layout = layout
  }

  // Padding
  const pt = fn.paddingTop ?? 0
  const pr = fn.paddingRight ?? 0
  const pb = fn.paddingBottom ?? 0
  const pl = fn.paddingLeft ?? 0
  if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
    result.padding = { top: pt, right: pr, bottom: pb, left: pl }
  }

  // 尺寸（layoutGrow=1 时不设固定宽度）
  if (node.layoutGrow !== 1 && node.absoluteBoundingBox) {
    result.width = node.absoluteBoundingBox.width
    result.height = node.absoluteBoundingBox.height
  }

  // 背景色（非 TEXT 节点）
  if (node.type !== 'TEXT') {
    const bgColor = convertFillsToBackgroundColor(node.fills, variableMap)
    if (bgColor) result.backgroundColor = bgColor
  }

  // 圆角
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii
    if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
      result.borderRadius = { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl }
    }
  } else if (node.cornerRadius && node.cornerRadius > 0) {
    const r = node.cornerRadius
    result.borderRadius = { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r }
  }

  // 边框
  if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
    const visibleStrokes = node.strokes.filter(s => s.visible !== false)
    if (visibleStrokes.length > 0) {
      const strokeColor = convertPaintToColor(visibleStrokes[0], variableMap)
      if (strokeColor) {
        result.border = { width: node.strokeWeight, color: strokeColor, style: 'solid' }
      }
    }
  }

  // 定位
  const isInAutoLayoutFlow =
    parent &&
    (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL') &&
    node.layoutPositioning !== 'ABSOLUTE'

  if (node.layoutPositioning === 'ABSOLUTE' || (node.constraints && parent && !isInAutoLayoutFlow)) {
    result.position = 'absolute'
    const transform = node.relativeTransform
    if (transform && transform.length >= 2 && parent?.absoluteBoundingBox) {
      result.positionOffsets = {
        left: `${transform[0][2]}px`,
        top: `${transform[1][2]}px`
      }
    }
  }

  // 文本样式（仅 TEXT 节点）
  if (node.type === 'TEXT') {
    const text: ParsedText = {}
    let hasText = false

    // 文字颜色来自 fills
    const visibleFills = (node.fills ?? []).filter(f => f.visible !== false)
    const solidFill = visibleFills.find(f => f.type === 'SOLID')
    if (solidFill) {
      const color = convertPaintToColor(solidFill, variableMap)
      if (color) { text.color = color; hasText = true }
    }

    if (node.style) {
      const s = node.style
      if (s.fontSize) { text.fontSize = s.fontSize; hasText = true }
      if (s.fontWeight) { text.fontWeight = s.fontWeight; hasText = true }
      if (s.lineHeightPx && s.lineHeightUnit === 'PIXELS') { text.lineHeight = s.lineHeightPx; hasText = true }
      if (s.letterSpacing !== undefined) {
        const ls = typeof s.letterSpacing === 'number' ? s.letterSpacing : (s.letterSpacing as { value: number }).value
        if (ls !== 0) { text.letterSpacing = ls; hasText = true }
      }
      if (s.textAlignHorizontal) {
        const alignMap: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' }
        const align = alignMap[s.textAlignHorizontal]
        if (align) { text.textAlign = align; hasText = true }
      }
      if (s.fontFamily) { text.fontFamily = s.fontFamily; hasText = true }
      if (s.italic) { text.fontStyle = 'italic'; hasText = true }
      if (s.textDecoration && s.textDecoration !== 'NONE') {
        text.textDecoration = s.textDecoration === 'UNDERLINE' ? 'underline' : 'line-through'
        hasText = true
      }
    }

    if (hasText) result.text = text
  }

  return result
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 计算父节点的内容宽度（扣除 padding） */
function getContentWidth(parent: Node): number | null {
  const box = parent.absoluteBoundingBox
  if (!box) return null
  const pl = parent.paddingLeft ?? 0
  const pr = parent.paddingRight ?? 0
  return box.width - pl - pr
}

function getTagForNode(node: Node, componentClassNameMap?: Map<string, string>): string {
  switch (node.type) {
    case 'TEXT':
      return 'span'
    case 'INSTANCE':
    case 'COMPONENT':
      // 优先用 annotation_config 精确映射
      if (node.componentId && componentClassNameMap) {
        const className = componentClassNameMap.get(node.componentId)
        if (className) return className
      }
      return nameToPascalCase(node.name)
    case 'FRAME':
    case 'GROUP':
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'VECTOR':
    default:
      return 'div'
  }
}

/** 从 INSTANCE 的 componentProperties 中提取有意义的属性（变体、文字、开关） */
function extractComponentProps(
  properties: Record<string, { type: string; value: string | boolean }>
): Record<string, { type: string; value: string | boolean }> {
  const result: Record<string, { type: string; value: string | boolean }> = {}

  for (const [rawKey, prop] of Object.entries(properties)) {
    // 清理 key 名：去掉 Figma 的 hash 后缀（如 "Text#81524:0" → "Text"）
    const cleanKey = rawKey.replace(/#\d+:\d+$/, '').trim()

    // 只保留有意义的属性
    if (prop.type === 'VARIANT') {
      result[cleanKey] = { type: 'VARIANT', value: prop.value }
    } else if (prop.type === 'TEXT' && typeof prop.value === 'string' && prop.value.length > 0) {
      result[cleanKey] = { type: 'TEXT', value: prop.value }
    } else if (prop.type === 'BOOLEAN' && prop.value === true) {
      // 只记录开启的开关
      result[cleanKey] = { type: 'BOOLEAN', value: true }
    }
  }

  return result
}

/** 将 Figma 节点名称转为 PascalCase 组件标签，例如 "icon/arrow-right" → "IconArrowRight" */
function nameToPascalCase(name: string): string {
  const result = name
    .split(/[\/\-_\s.]+/)
    .filter(Boolean)
    .filter(part => !/^\d+$/.test(part))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/[^A-Za-z0-9]/g, '')

  if (!result || /^\d/.test(result)) return 'div'
  return result
}
