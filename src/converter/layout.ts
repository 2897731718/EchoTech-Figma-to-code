import type { Node, Rect, Transform } from '../api/types'

export interface FrameNode extends Node {
  type: 'FRAME' | 'COMPONENT' | 'INSTANCE'
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID'
  layoutWrap?: 'NO_WRAP' | 'WRAP'
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  counterAxisSpacing?: number
}

export function convertAutoLayout(node: FrameNode): Record<string, string> {
  const css: Record<string, string> = {}

  if (!node.layoutMode || node.layoutMode === 'NONE') {
    return css
  }

  if (node.layoutMode === 'GRID') {
    css.display = 'grid'
  } else {
    css.display = 'flex'
    // row 是 flex 默认值，仅 column 时输出
    if (node.layoutMode === 'VERTICAL') {
      css['flex-direction'] = 'column'
    }
    // wrap 模式
    if (node.layoutWrap === 'WRAP') {
      css['flex-wrap'] = 'wrap'
    }
  }

  // 间距处理
  const mainGap = node.itemSpacing ?? 0
  const crossGap = node.counterAxisSpacing ?? 0

  if (mainGap > 0 || crossGap > 0) {
    if (mainGap === crossGap || crossGap === 0) {
      // 相同或只有主轴间距，用简写
      if (mainGap > 0) css.gap = `${mainGap}px`
    } else {
      // HORIZONTAL: itemSpacing=column-gap, counterAxisSpacing=row-gap
      // VERTICAL: itemSpacing=row-gap, counterAxisSpacing=column-gap
      // GRID: 同 HORIZONTAL
      if (node.layoutMode === 'VERTICAL') {
        if (mainGap > 0) css['row-gap'] = `${mainGap}px`
        if (crossGap > 0) css['column-gap'] = `${crossGap}px`
      } else {
        if (crossGap > 0) css['row-gap'] = `${crossGap}px`
        if (mainGap > 0) css['column-gap'] = `${mainGap}px`
      }
    }
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

  // Padding（undefined 视为 0）
  const pt = node.paddingTop ?? 0
  const pr = node.paddingRight ?? 0
  const pb = node.paddingBottom ?? 0
  const pl = node.paddingLeft ?? 0
  if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
    if (pt === pr && pr === pb && pb === pl) {
      css.padding = `${pt}px`
    } else {
      css.padding = `${pt}px ${pr}px ${pb}px ${pl}px`
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
    case 'LEFT':
      css.left = `${left}px`
      break
    case 'RIGHT':
      css.right = `${right}px`
      break
    case 'CENTER':
      css.left = `calc(50% - ${parentWidth / 2 - left}px)`
      break
    case 'LEFT_RIGHT':
      css.left = `${left}px`
      css.right = `${right}px`
      break
    case 'SCALE':
      css.left = `${(left / parentWidth) * 100}%`
      css.right = `${(right / parentWidth) * 100}%`
      break
  }

  switch (vertical) {
    case 'TOP':
      css.top = `${top}px`
      break
    case 'BOTTOM':
      css.bottom = `${bottom}px`
      break
    case 'CENTER':
      css.top = `calc(50% - ${parentHeight / 2 - top}px)`
      break
    case 'TOP_BOTTOM':
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
