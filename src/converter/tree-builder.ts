import type { Node } from '../api/types'
import type { ComponentNode, StyleConverter } from './generators/types'
import { convertNodeToCSS } from './index'
import type { VariableMap } from './colors'

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
 * - 对 INSTANCE 节点清空 children（不展开内部实现）
 */
export function simplifyNode(node: Node, isRoot = false): Node {
  // 策略一：INSTANCE / 嵌套 COMPONENT 不展开子节点（根节点除外）
  if (!isRoot && (node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
    return { ...node, children: [] }
  }

  // 先递归简化 children
  const simplifiedChildren = (node.children ?? [])
    .filter(c => c.visible !== false)
    .map(c => simplifyNode(c))

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
  i18nMap?: Map<string, string>
): ComponentNode | null {
  if (node.visible === false) return null

  const css = convertNodeToCSS(node, parent, nodeMap, variableMap)

  // 策略三：宽度自适应检测
  if (parent && css['width'] && css['height']) {
    const parentContentWidth = getContentWidth(parent)
    const nodeWidth = node.absoluteBoundingBox?.width
    if (parentContentWidth && nodeWidth && Math.abs(nodeWidth - parentContentWidth) <= 1) {
      delete css['width']
      // 高度也只在明确固定尺寸时保留（非文字/非自适应节点）
      if (node.type !== 'TEXT') {
        delete css['height']
      }
    }
  }

  const styleResult = styleConverter.convert(css, node.id)

  const componentNode: ComponentNode = {
    tag: getTagForNode(node),
    nodeId: node.id,
    props: {},
    ...(node.componentId ? { componentId: node.componentId } : {})
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
      const childNode = buildComponentTree(child, styleConverter, node, nodeMap, variableMap, i18nMap)
      if (childNode) {
        componentNode.children.push(childNode)
      }
    }
  }

  return componentNode
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

function getTagForNode(node: Node): string {
  switch (node.type) {
    case 'TEXT':
      return 'span'
    case 'INSTANCE':
    case 'COMPONENT':
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
