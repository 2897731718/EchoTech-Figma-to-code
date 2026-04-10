import type { ComponentNode } from './types'

// ─── 结构化样式定义（平台无关） ─────────────────────────────────────────────────

export interface ParsedLayout {
  direction: 'row' | 'column'
  gap?: number
  justify?: 'start' | 'center' | 'end' | 'space-between'
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
}

export interface ParsedPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ParsedBorderRadius {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export interface ParsedBorder {
  width: number
  color: string
  style: string
}

export interface ParsedText {
  color?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: string
  fontFamily?: string
  fontStyle?: string
  textDecoration?: string
  textTransform?: string
}

export interface ParsedPositionOffsets {
  top?: string
  right?: string
  bottom?: string
  left?: string
}

export interface ParsedStyles {
  layout?: ParsedLayout
  padding?: ParsedPadding
  width?: number | string
  height?: number | string
  backgroundColor?: string
  borderRadius?: ParsedBorderRadius
  border?: ParsedBorder
  opacity?: number
  position?: 'absolute'
  positionOffsets?: ParsedPositionOffsets
  text?: ParsedText
}

// ─── UnoCSS 类名解析 ────────────────────────────────────────────────────────

const FLEX_DIR_RE = /^flex-(row|col)$/
const GAP_RE = /^gap-\[?(\d+(?:px)?)\]?$/
const P_ALL_RE = /^p-\[?(\d+(?:px)?)\]?$/
const PX_RE = /^px-\[?(\d+(?:px)?)\]?$/
const PY_RE = /^py-\[?(\d+(?:px)?)\]?$/
const PT_RE = /^pt-\[?(\d+(?:px)?)\]?$/
const PR_RE = /^pr-\[?(\d+(?:px)?)\]?$/
const PB_RE = /^pb-\[?(\d+(?:px)?)\]?$/
const PL_RE = /^pl-\[?(\d+(?:px)?)\]?$/
const W_RE = /^w-\[?(\d+(?:px)?)\]?$/
const H_RE = /^h-\[?(\d+(?:px)?)\]?$/
const ROUNDED_RE = /^rounded-\[?(\d+(?:px)?)\]?$/
const BG_COLOR_RE = /^bg-\[([^\]]+)\]$/
const OPACITY_RE = /^opacity-(\d+)$/
const TEXT_COLOR_RE = /^text-\[([^\]]+)\]$/
const TEXT_SIZE_RE = /^text-\[(\d+)px\]$/
const FONT_WEIGHT_RE = /^font-\[(\d+)\]$/
const LEADING_RE = /^leading-\[(\d+)px\]$/

function parseNumericValue(val: string): number {
  return parseInt(val.replace('px', ''), 10)
}

function parseClassNames(className: string): Partial<ParsedStyles> {
  const classes = className.split(/\s+/).filter(Boolean)
  const result: Partial<ParsedStyles> = {}
  const padding: ParsedPadding = { top: 0, right: 0, bottom: 0, left: 0 }
  let hasPadding = false
  let hasLayout = false
  const layout: ParsedLayout = { direction: 'row' }
  const text: ParsedText = {}
  let hasText = false

  for (const cls of classes) {
    // flex 布局
    if (cls === 'flex') {
      hasLayout = true
      continue
    }
    let m: RegExpMatchArray | null

    if ((m = cls.match(FLEX_DIR_RE))) {
      hasLayout = true
      layout.direction = m[1] === 'col' ? 'column' : 'row'
      continue
    }
    if (cls === 'flex-col') {
      hasLayout = true
      layout.direction = 'column'
      continue
    }

    // justify / align
    if (cls === 'justify-center') { hasLayout = true; layout.justify = 'center'; continue }
    if (cls === 'justify-end') { hasLayout = true; layout.justify = 'end'; continue }
    if (cls === 'justify-between') { hasLayout = true; layout.justify = 'space-between'; continue }
    if (cls === 'items-center') { hasLayout = true; layout.align = 'center'; continue }
    if (cls === 'items-end') { hasLayout = true; layout.align = 'end'; continue }
    if (cls === 'items-baseline') { hasLayout = true; layout.align = 'baseline'; continue }
    if (cls === 'items-stretch') { hasLayout = true; layout.align = 'stretch'; continue }

    // gap
    if ((m = cls.match(GAP_RE))) {
      hasLayout = true
      layout.gap = parseNumericValue(m[1])
      continue
    }

    // padding
    if ((m = cls.match(P_ALL_RE))) {
      const v = parseNumericValue(m[1])
      padding.top = padding.right = padding.bottom = padding.left = v
      hasPadding = true
      continue
    }
    if ((m = cls.match(PX_RE))) {
      const v = parseNumericValue(m[1])
      padding.right = padding.left = v
      hasPadding = true
      continue
    }
    if ((m = cls.match(PY_RE))) {
      const v = parseNumericValue(m[1])
      padding.top = padding.bottom = v
      hasPadding = true
      continue
    }
    if ((m = cls.match(PT_RE))) { padding.top = parseNumericValue(m[1]); hasPadding = true; continue }
    if ((m = cls.match(PR_RE))) { padding.right = parseNumericValue(m[1]); hasPadding = true; continue }
    if ((m = cls.match(PB_RE))) { padding.bottom = parseNumericValue(m[1]); hasPadding = true; continue }
    if ((m = cls.match(PL_RE))) { padding.left = parseNumericValue(m[1]); hasPadding = true; continue }

    // 尺寸
    if ((m = cls.match(W_RE))) { result.width = parseNumericValue(m[1]); continue }
    if ((m = cls.match(H_RE))) { result.height = parseNumericValue(m[1]); continue }

    // 圆角
    if ((m = cls.match(ROUNDED_RE))) {
      const v = parseNumericValue(m[1])
      result.borderRadius = { topLeft: v, topRight: v, bottomRight: v, bottomLeft: v }
      continue
    }

    // 背景色
    if ((m = cls.match(BG_COLOR_RE))) { result.backgroundColor = m[1]; continue }
    if (cls.startsWith('bg-white')) { result.backgroundColor = '#ffffff'; continue }
    if (cls.startsWith('bg-black')) { result.backgroundColor = '#000000'; continue }

    // 透明度
    if ((m = cls.match(OPACITY_RE))) { result.opacity = parseInt(m[1], 10) / 100; continue }

    // 文本颜色
    if ((m = cls.match(TEXT_COLOR_RE))) { text.color = m[1]; hasText = true; continue }
    if (cls === 'text-black') { text.color = '#000000'; hasText = true; continue }
    if (cls === 'text-white') { text.color = '#ffffff'; hasText = true; continue }

    // 文本尺寸
    if ((m = cls.match(TEXT_SIZE_RE))) { text.fontSize = parseInt(m[1], 10); hasText = true; continue }

    // 字重
    if ((m = cls.match(FONT_WEIGHT_RE))) { text.fontWeight = parseInt(m[1], 10); hasText = true; continue }
    if (cls === 'font-bold') { text.fontWeight = 700; hasText = true; continue }
    if (cls === 'font-medium') { text.fontWeight = 500; hasText = true; continue }

    // 行高
    if ((m = cls.match(LEADING_RE))) { text.lineHeight = parseInt(m[1], 10); hasText = true; continue }
  }

  if (hasLayout) result.layout = layout
  if (hasPadding) result.padding = padding
  if (hasText) result.text = text

  return result
}

// ─── 内联 CSS 样式解析 ───────────────────────────────────────────────────────

function parseInlineStyles(style: Record<string, string>): Partial<ParsedStyles> {
  const result: Partial<ParsedStyles> = {}
  const text: ParsedText = {}
  let hasText = false

  for (const [key, value] of Object.entries(style)) {
    switch (key) {
      case 'display':
        if (value === 'flex') {
          result.layout = result.layout ?? { direction: 'row' }
        }
        break
      case 'flex-direction':
        result.layout = result.layout ?? { direction: 'row' }
        result.layout.direction = value === 'column' ? 'column' : 'row'
        break
      case 'gap': {
        result.layout = result.layout ?? { direction: 'row' }
        const gapVal = parseInt(value, 10)
        if (!isNaN(gapVal)) result.layout.gap = gapVal
        break
      }
      case 'justify-content': {
        result.layout = result.layout ?? { direction: 'row' }
        const justifyMap: Record<string, ParsedLayout['justify']> = {
          'flex-start': 'start', 'center': 'center', 'flex-end': 'end', 'space-between': 'space-between'
        }
        result.layout.justify = justifyMap[value]
        break
      }
      case 'align-items': {
        result.layout = result.layout ?? { direction: 'row' }
        const alignMap: Record<string, ParsedLayout['align']> = {
          'flex-start': 'start', 'center': 'center', 'flex-end': 'end', 'baseline': 'baseline', 'stretch': 'stretch'
        }
        result.layout.align = alignMap[value]
        break
      }
      case 'padding': {
        const parts = value.split(/\s+/).map(v => parseInt(v, 10))
        if (parts.length === 1) {
          result.padding = { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
        } else if (parts.length === 2) {
          result.padding = { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
        } else if (parts.length === 4) {
          result.padding = { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
        }
        break
      }
      case 'width': {
        const w = parseInt(value, 10)
        result.width = isNaN(w) ? value : w
        break
      }
      case 'height': {
        const h = parseInt(value, 10)
        result.height = isNaN(h) ? value : h
        break
      }
      case 'background-color':
        result.backgroundColor = value
        break
      case 'border-radius': {
        const parts = value.split(/\s+/).map(v => parseInt(v, 10))
        if (parts.length === 1) {
          result.borderRadius = { topLeft: parts[0], topRight: parts[0], bottomRight: parts[0], bottomLeft: parts[0] }
        } else if (parts.length === 4) {
          result.borderRadius = { topLeft: parts[0], topRight: parts[1], bottomRight: parts[2], bottomLeft: parts[3] }
        }
        break
      }
      case 'border-width':
        result.border = result.border ?? { width: 0, color: '', style: 'solid' }
        result.border.width = parseInt(value, 10)
        break
      case 'border-color':
        result.border = result.border ?? { width: 1, color: '', style: 'solid' }
        result.border.color = value
        break
      case 'border-style':
        result.border = result.border ?? { width: 1, color: '', style: 'solid' }
        result.border.style = value
        break
      case 'opacity':
        result.opacity = parseFloat(value)
        break
      case 'position':
        if (value === 'absolute') result.position = 'absolute'
        break
      case 'top':
      case 'right':
      case 'bottom':
      case 'left':
        result.positionOffsets = result.positionOffsets ?? {}
        result.positionOffsets[key] = value
        break
      // 文本属性
      case 'color':
        text.color = value; hasText = true
        break
      case 'font-size':
        text.fontSize = parseInt(value, 10); hasText = true
        break
      case 'font-weight':
        text.fontWeight = parseInt(value, 10); hasText = true
        break
      case 'line-height':
        text.lineHeight = parseInt(value, 10); hasText = true
        break
      case 'letter-spacing': {
        const ls = parseFloat(value)
        if (ls !== 0) { text.letterSpacing = ls; hasText = true }
        break
      }
      case 'text-align':
        text.textAlign = value; hasText = true
        break
      case 'font-family':
        text.fontFamily = value.replace(/['"]/g, ''); hasText = true
        break
      case 'font-style':
        text.fontStyle = value; hasText = true
        break
      case 'text-decoration':
        text.textDecoration = value; hasText = true
        break
      case 'text-transform':
        text.textTransform = value; hasText = true
        break
    }
  }

  if (hasText) result.text = text

  return result
}

// ─── 合并两个 ParsedStyles ──────────────────────────────────────────────────

function mergeStyles(base: Partial<ParsedStyles>, override: Partial<ParsedStyles>): ParsedStyles {
  const result: ParsedStyles = { ...base, ...override }

  // 合并 layout
  if (base.layout && override.layout) {
    result.layout = { ...base.layout, ...override.layout }
  }

  // 合并 padding
  if (base.padding && override.padding) {
    result.padding = { ...base.padding, ...override.padding }
  }

  // 合并 text
  if (base.text && override.text) {
    result.text = { ...base.text, ...override.text }
  }

  // 合并 border
  if (base.border && override.border) {
    result.border = { ...base.border, ...override.border }
  }

  // 合并 positionOffsets
  if (base.positionOffsets && override.positionOffsets) {
    result.positionOffsets = { ...base.positionOffsets, ...override.positionOffsets }
  }

  return result as ParsedStyles
}

// ─── 主入口 ──────────────────────────────────────────────────────────────────

/**
 * 从 ComponentNode 的 className（UnoCSS 类名）和 style（内联 CSS）中
 * 提取结构化布局信息，供各平台生成器使用。
 */
export function parseStyles(node: ComponentNode): ParsedStyles {
  const fromClass = node.className ? parseClassNames(node.className) : {}
  const fromStyle = node.style ? parseInlineStyles(node.style) : {}

  // className 优先，style 补充（className 是 UnoCSS 转换后的，更准确）
  return mergeStyles(fromStyle, fromClass)
}
