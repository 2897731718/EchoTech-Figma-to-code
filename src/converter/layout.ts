import type { Node, Rect, Transform } from '../api/types'

export interface FrameNode extends Node {
  type: 'FRAME' | 'COMPONENT' | 'INSTANCE'
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
}

export function convertAutoLayout(node: FrameNode): Record<string, string> {
  const css: Record<string, string> = {}

  if (!node.layoutMode || node.layoutMode === 'NONE') {
    return css
  }

  css.display = 'flex'
  css['flex-direction'] = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'

  if (typeof node.itemSpacing === 'number') {
    css.gap = `${node.itemSpacing}px`
  }

  if (node.primaryAxisAlignItems) {
    const justifyMap: Record<string, string> = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      SPACE_BETWEEN: 'space-between'
    }
    css['justify-content'] = justifyMap[node.primaryAxisAlignItems] || 'flex-start'
  }

  if (node.counterAxisAlignItems) {
    const alignMap: Record<string, string> = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      BASELINE: 'baseline'
    }
    css['align-items'] = alignMap[node.counterAxisAlignItems] || 'flex-start'
  }

  if (
    typeof node.paddingTop === 'number' &&
    typeof node.paddingRight === 'number' &&
    typeof node.paddingBottom === 'number' &&
    typeof node.paddingLeft === 'number'
  ) {
    if (
      node.paddingTop === node.paddingRight &&
      node.paddingRight === node.paddingBottom &&
      node.paddingBottom === node.paddingLeft
    ) {
      if (node.paddingTop !== 0) {
        css.padding = `${node.paddingTop}px`
      }
    } else {
      css.padding = `${node.paddingTop}px ${node.paddingRight}px ${node.paddingBottom}px ${node.paddingLeft}px`
    }
  }

  return css
}

export function calculateConstraints(
  node: Node,
  parent: Node | undefined
): Record<string, string> {
  const css: Record<string, string> = {}

  if (!node.constraints || !parent) {
    return css
  }

  const nodeBounds = node.absoluteBoundingBox
  const parentBounds = parent.absoluteBoundingBox

  if (!nodeBounds || !parentBounds) {
    return css
  }

  const transform = node.relativeTransform
  if (!transform || transform.length < 2) {
    return css
  }

  const left = transform[0][2]
  const top = transform[1][2]
  const nodeWidth = nodeBounds.width
  const nodeHeight = nodeBounds.height
  const parentWidth = parentBounds.width
  const parentHeight = parentBounds.height

  const right = parentWidth - nodeWidth - left
  const bottom = parentHeight - nodeHeight - top

  css.position = 'absolute'

  const { horizontal, vertical } = node.constraints

  switch (horizontal) {
    case 'MIN':
      css.left = `${left}px`
      break
    case 'MAX':
      css.right = `${right}px`
      break
    case 'CENTER': {
      const offset = nodeWidth / 2 + (parentWidth / 2 - nodeWidth / 2 - left)
      css.left = `calc(50% - ${offset}px)`
      break
    }
    case 'STRETCH':
      css.left = `${left}px`
      css.right = `${right}px`
      break
    case 'SCALE':
      css.left = `${(left / parentWidth) * 100}%`
      css.right = `${(right / parentWidth) * 100}%`
      break
  }

  switch (vertical) {
    case 'MIN':
      css.top = `${top}px`
      break
    case 'MAX':
      css.bottom = `${bottom}px`
      break
    case 'CENTER': {
      const offset = nodeHeight / 2 + (parentHeight / 2 - nodeHeight / 2 - top)
      css.top = `calc(50% - ${offset}px)`
      break
    }
    case 'STRETCH':
      css.top = `${top}px`
      css.bottom = `${bottom}px`
      break
    case 'SCALE':
      css.top = `${(top / parentHeight) * 100}%`
      css.bottom = `${(bottom / parentHeight) * 100}%`
      break
  }

  if (!css.left && !css.right) {
    css.left = `${left}px`
  }
  if (!css.top && !css.bottom) {
    css.top = `${top}px`
  }

  return css
}
