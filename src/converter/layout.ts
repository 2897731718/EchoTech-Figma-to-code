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
  // row 是 flex 默认值，仅 column 时输出
  if (node.layoutMode === 'VERTICAL') {
    css['flex-direction'] = 'column'
  }

  if (typeof node.itemSpacing === 'number') {
    css.gap = `${node.itemSpacing}px`
  }

  // MIN (flex-start) 是默认值，不输出
  if (node.primaryAxisAlignItems && node.primaryAxisAlignItems !== 'MIN') {
    const justifyMap: Record<string, string> = {
      CENTER: 'center',
      MAX: 'flex-end',
      SPACE_BETWEEN: 'space-between'
    }
    const val = justifyMap[node.primaryAxisAlignItems]
    if (val) css['justify-content'] = val
  }

  // MIN (flex-start / stretch) 是默认值，不输出
  if (node.counterAxisAlignItems && node.counterAxisAlignItems !== 'MIN') {
    const alignMap: Record<string, string> = {
      CENTER: 'center',
      MAX: 'flex-end',
      BASELINE: 'baseline'
    }
    const val = alignMap[node.counterAxisAlignItems]
    if (val) css['align-items'] = val
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
    } else if (node.paddingTop !== 0 || node.paddingRight !== 0 || node.paddingBottom !== 0 || node.paddingLeft !== 0) {
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
    case 'CENTER':
      css.left = `calc(50% - ${parentWidth / 2 - left}px)`
      break
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
    case 'CENTER':
      css.top = `calc(50% - ${parentHeight / 2 - top}px)`
      break
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
