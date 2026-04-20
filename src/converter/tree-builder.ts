import type { Node } from '../api/types'
import type { ComponentNode, StyleConverter } from './generators/types'
import type { ParsedStyles, ParsedLayout, ParsedPadding, ParsedBorderRadius, ParsedBorder, ParsedText } from './generators/style-parser'
import { convertNodeToCSS } from './index'
import { convertPaintToColor, type VariableMap } from './colors'
import { convertFillsToBackgroundColor } from './styles'
import type { FrameNode } from './layout'
import type { AnnotationPlatform } from './annotation'

// ─── INSTANCE 智能折叠：基础组件检测 ─────────────────────────────────────────

/** 提取字符串开头的 emoji（trim 后匹配，容忍设计师输入前导空格） */
function extractLeadingEmoji(name: string): string | null {
  const match = name.trim().match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u)
  return match ? match[1] : null
}

/**
 * 自动检测基础组件的 emoji 前缀：
 * 扫描所有 INSTANCE 的 name，找出占比 > 40% 的高频 emoji 前缀
 */
export function detectBaseComponentPrefixes(root: Node): string[] {
  const namesByComponent = new Map<string, string>()

  function walk(node: Node) {
    if ((node.type === 'INSTANCE' || node.type === 'COMPONENT') && node.componentId && node.name) {
      if (!namesByComponent.has(node.componentId)) {
        namesByComponent.set(node.componentId, node.name)
      }
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child)
      }
    }
  }
  walk(root)

  if (namesByComponent.size === 0) return []

  // 统计 emoji 前缀频率
  const emojiCount = new Map<string, number>()
  for (const name of namesByComponent.values()) {
    const emoji = extractLeadingEmoji(name)
    if (emoji) {
      emojiCount.set(emoji, (emojiCount.get(emoji) ?? 0) + 1)
    }
  }

  // 占比超过 40% 的 emoji 认定为基础组件前缀
  const threshold = namesByComponent.size * 0.4
  const prefixes: string[] = []
  for (const [emoji, count] of emojiCount) {
    if (count >= threshold) {
      prefixes.push(emoji)
    }
  }

  if (prefixes.length > 0) {
    console.error(`[figma-to-code] 自动检测基础组件前缀: ${prefixes.map(p => `"${p}"`).join(', ')}（${namesByComponent.size} 个组件）`)
  }

  return prefixes
}

/** 判断 INSTANCE 节点的 children 中是否嵌套了其他 INSTANCE（穿透 FRAME/GROUP） */
function hasNestedInstance(node: Node): boolean {
  for (const child of (node.children ?? [])) {
    if (child.visible === false) continue
    if (child.type === 'INSTANCE' || child.type === 'COMPONENT') return true
    if ((child.type === 'FRAME' || child.type === 'GROUP') && hasNestedInstance(child)) return true
  }
  return false
}

/** INSTANCE 折叠配置 */
export interface InstanceFoldingOptions {
  /** 手动指定基础组件前缀（优先级最高） */
  baseComponentPrefixes?: string[]
  /** 自动检测出的 emoji 前缀（由 detectBaseComponentPrefixes 生成） */
  detectedPrefixes?: string[]
}

/**
 * 判断 INSTANCE 是否应该折叠（剥离 children）：
 * 优先级：配置前缀 > 自动检测前缀 > 树结构兜底（叶子 INSTANCE）
 */
function shouldFoldInstance(node: Node, options?: InstanceFoldingOptions): boolean {
  const name = node.name?.trim() ?? ''

  // 1. 配置的前缀优先
  if (options?.baseComponentPrefixes?.length) {
    return options.baseComponentPrefixes.some(p => name.startsWith(p))
  }

  // 2. 自动检测的 emoji 前缀
  if (options?.detectedPrefixes?.length) {
    return options.detectedPrefixes.some(p => name.startsWith(p))
  }

  // 3. 兜底：叶子 INSTANCE（children 里没有嵌套 INSTANCE）→ 折叠
  return !hasNestedInstance(node)
}

// ─── 矢量形状类型集合（图标路径、布尔运算、基础形状） ─────────────────────────
const VECTOR_SHAPE_TYPES = new Set([
  'VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE', 'REGULAR_POLYGON'
])

/**
 * 判断节点是否为矢量图标容器：
 * 所有可见子节点均为矢量形状（VECTOR/BOOLEAN_OPERATION/STAR 等）
 */
function isVectorIconContainer(node: Node): boolean {
  const visibleChildren = (node.children ?? []).filter(c => c.visible !== false)
  if (visibleChildren.length === 0) return false
  return visibleChildren.every(c => VECTOR_SHAPE_TYPES.has(c.type))
}

/**
 * 检测图标名是否有效（kebab-case 且不含中文等异常字符）
 */
function isValidIconName(name: string): boolean {
  // 包含中文 → 无效
  if (/[\u4e00-\u9fa5]/.test(name)) return false
  // 包含日文假名 → 无效
  if (/[\u3040-\u30ff]/.test(name)) return false
  // 常见占位符词汇 → 无效
  const placeholderWords = ['title', 'icon', 'placeholder', 'image', 'img', 'bg', 'background']
  if (placeholderWords.includes(name.toLowerCase())) return false
  // 太短且无连字符（如 bg、abc）→ 可能是占位符，标记为待确认
  if (name.length <= 3 && !name.includes('-')) return false
  // 正常 kebab-case
  return true
}

/** 收集需要手动修改的图标名（用于 CLI 汇总输出） */
export const todoIconNames: string[] = []

/**
 * 从节点名提取图标名，转为 kebab-case
 * 例如：
 *   "IconArrowRight" → "arrow-right"
 *   "icon/arrow-right" → "arrow-right"
 *   "Arrow Right" → "arrow-right"
 *   "💙 Icon/Close" → "close"
 *   "后续可编辑" → "icon-todo--后续可编辑"（异常图标名，添加前缀标记）
 */
export function extractIconName(nodeName: string): string {
  const originalName = nodeName.trim()

  let name = originalName
    // 移除 emoji 前缀
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '')
    // 移除常见前缀
    .replace(/^(icon[_\-/\s]*)/i, '')
    // 移除路径分隔符前的内容（取最后一段）
    .split(/[/\\]/).pop() || ''

  // PascalCase/camelCase → kebab-case
  name = name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    // 空格、下划线 → 短横线
    .replace(/[\s_]+/g, '-')
    // 清理多余短横线
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!name) return 'icon'

  // 检测图标名是否有效，无效则添加 icon-todo-- 前缀
  if (!isValidIconName(name)) {
    const todoName = `icon-todo--${name}`
    todoIconNames.push(name)
    return todoName
  }

  return name
}

/**
 * 判断节点是否为横滑容器：
 * 横向 flex 布局 + 子元素总宽超过容器宽
 */
function isScrollContainer(node: Node): boolean {
  if (node.layoutMode !== 'HORIZONTAL' || !node.absoluteBoundingBox) return false

  const parentWidth = node.absoluteBoundingBox.width
  const visibleChildren = (node.children ?? []).filter(c => c.visible !== false)
  if (visibleChildren.length < 3 || parentWidth < 200) return false

  const gap = node.itemSpacing ?? 0
  let totalChildWidth = 0
  for (const child of visibleChildren) {
    if (child.absoluteBoundingBox) totalChildWidth += child.absoluteBoundingBox.width
  }
  totalChildWidth += (visibleChildren.length - 1) * gap

  return totalChildWidth > parentWidth
}

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
 * 递归抓取节点子树里所有可见 TEXT 的 characters，用于 INSTANCE 折叠前保留文本。
 * 空串、不可见节点跳过；顺序为深度优先遍历顺序（保留视觉阅读顺序）。
 */
function collectTextOverrides(nodes: Node[]): Array<{ name?: string; text: string }> {
  const result: Array<{ name?: string; text: string }> = []
  for (const n of nodes) {
    if (n.visible === false) continue
    if (n.type === 'TEXT') {
      const text = (n.characters ?? '').trim()
      if (text.length > 0) {
        result.push(n.name ? { name: n.name, text } : { text })
      }
    }
    if (n.children) {
      result.push(...collectTextOverrides(n.children))
    }
  }
  return result
}

/**
 * 简化 Figma 节点树：
 * - 折叠基础组件 INSTANCE（配置前缀 > 自动检测 emoji > 叶子 INSTANCE 兜底）
 * - 折叠矢量图标容器（children 全是 VECTOR）
 * - 折叠透传容器（单子节点且无视觉样式）
 */
export function simplifyNode(
  node: Node,
  isRoot = false,
  mappedComponentIds?: Set<string>,
  foldingOptions?: InstanceFoldingOptions
): Node {
  // 策略一：INSTANCE / 嵌套 COMPONENT 节点处理（根节点除外）
  if (!isRoot && (node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
    // annotation_config 精确映射优先
    const isMapped = node.componentId && mappedComponentIds?.has(node.componentId)
    if (isMapped || shouldFoldInstance(node, foldingOptions)) {
      // 折叠前先抓子节点的 TEXT 文本，避免非 property-bound 的直接覆盖丢失
      const textOverrides = collectTextOverrides(node.children ?? [])
      const folded = { ...node, children: [] } as Node & { _textOverrides?: Array<{ name?: string; text: string }> }
      if (textOverrides.length > 0) folded._textOverrides = textOverrides
      return folded
    }
    // 业务/组合组件：继续递归简化子节点，不折叠
  }

  // 策略 1.5：矢量图标容器折叠（children 全是 VECTOR 等形状 → 视为图标，剥离子节点）
  if (!isRoot && isVectorIconContainer(node)) {
    return { ...node, children: [], _vectorIcon: true } as Node
  }

  // 先递归简化 children
  const simplifiedChildren = (node.children ?? [])
    .filter(c => c.visible !== false)
    .map(c => simplifyNode(c, false, mappedComponentIds, foldingOptions))

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
  componentClassNameMap?: Map<string, AnnotationPlatform>
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

  const isVectorIcon = (node as Node & { _vectorIcon?: boolean })._vectorIcon === true
  const iconName = isVectorIcon && node.name ? extractIconName(node.name) : undefined
  const scrollContainer = isScrollContainer(node)
  const annotation = node.componentId ? componentClassNameMap?.get(node.componentId) : undefined
  const textOverrides = (node as Node & { _textOverrides?: Array<{ name?: string; text: string }> })._textOverrides

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
    ...(node.layoutGrow === 1 ? { isExpanded: true } : {}),
    // 矢量图标容器标记 + 图标名
    ...(isVectorIcon ? { isVectorIcon: true, iconName } : {}),
    // 横滑容器标记
    ...(scrollContainer ? { isScrollContainer: true, scrollAxis: 'horizontal' as const } : {}),
    // auto-layout wrap（GridView 识别依据）
    ...(node.layoutWrap === 'WRAP' ? { layoutWrap: 'WRAP' as const } : {}),
    // 组件文档链接（供生成器输出 import / 注释）
    ...(annotation?.docLink ? { componentDocLink: annotation.docLink } : {}),
    // 折叠前抓到的直接文本覆盖（设计师直接改子节点文字的场景）
    ...(textOverrides && textOverrides.length > 0 ? { instanceTextOverrides: textOverrides } : {}),
    // 未映射 INSTANCE/COMPONENT：tag 是由 nameToPascalCase 降级得来，需要提示 IDE AI 查阅项目规范
    ...(((node.type === 'INSTANCE' || node.type === 'COMPONENT') && node.componentId && !annotation?.className)
      ? { isUnmappedInstance: true as const } : {})
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

function getTagForNode(node: Node, componentClassNameMap?: Map<string, AnnotationPlatform>): string {
  switch (node.type) {
    case 'TEXT':
      return 'span'
    case 'INSTANCE':
    case 'COMPONENT':
      // 优先用 annotation_config 精确映射
      if (node.componentId && componentClassNameMap) {
        const annotation = componentClassNameMap.get(node.componentId)
        if (annotation?.className) return annotation.className
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
