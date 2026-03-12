import type { Node } from '../api/types'
import type { ComponentNode, StyleConverter } from './generators/types'
import { convertNodeToCSS } from './index'

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
export function simplifyNode(node: Node): Node {
  // 策略一：INSTANCE 不展开子节点
  if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
    return { ...node, children: [] }
  }

  // 先递归简化 children
  const simplifiedChildren = (node.children ?? [])
    .filter(c => c.visible !== false)
    .map(simplifyNode)

  const nodeWithChildren = { ...node, children: simplifiedChildren }

  // 策略二：折叠透传容器（简化后只剩一个子节点）
  if (simplifiedChildren.length === 1 && isPassthrough(nodeWithChildren)) {
    return simplifiedChildren[0]
  }

  return nodeWithChildren
}

// ─── 构建组件树 ───────────────────────────────────────────────────────────────

export function buildComponentTree(
  node: Node,
  styleConverter: StyleConverter,
  parent: Node | undefined,
  nodeMap: Map<string, Node>
): ComponentNode | null {
  if (node.visible === false) return null

  const css = convertNodeToCSS(node, parent, nodeMap)

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
    props: {}
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
  } else if (node.children && node.children.length > 0) {
    componentNode.children = []
    for (const child of node.children) {
      const childNode = buildComponentTree(child, styleConverter, node, nodeMap)
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
