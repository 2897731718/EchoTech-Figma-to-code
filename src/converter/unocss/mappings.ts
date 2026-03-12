export interface UnoCSSMapping {
  pattern: RegExp | string
  class: string | ((value: string) => string)
}

// UnoCSS 间距单位：1 unit = 0.25rem = 4px
// 例：gap-2 = 0.5rem = 8px，h-6 = 1.5rem = 24px
const PX_TO_UNIT_RATIO = 0.25

function pxToSpacing(px: number): string {
  if (px === 0) return '0'
  const rounded = Math.round(px)
  const unit = Math.round(rounded * PX_TO_UNIT_RATIO * 4) / 4  // 保留 0.25 精度
  // unit 是 0.25 整数倍则用 UnoCSS unit，否则用 [Npx]
  if (unit * 4 === Math.round(unit * 4)) {
    return String(unit)
  }
  return `[${rounded}px]`
}

export const DISPLAY_MAPPINGS: Record<string, string> = {
  'flex': 'flex',
  'block': 'block',
  'inline': 'inline',
  'inline-block': 'inline-block',
  'grid': 'grid',
  'none': 'hidden'
}

export const FLEX_DIRECTION_MAPPINGS: Record<string, string> = {
  'row': 'flex-row',
  'column': 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse'
}

export const ALIGN_ITEMS_MAPPINGS: Record<string, string> = {
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  'center': 'items-center',
  'baseline': 'items-baseline',
  'stretch': 'items-stretch'
}

export const JUSTIFY_CONTENT_MAPPINGS: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  'center': 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly'
}

export function convertSpacing(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = parseFloat(match[1])
  const spacing = pxToSpacing(px)
  return `p-${spacing}`
}

export function convertGap(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = parseFloat(match[1])
  const spacing = pxToSpacing(px)
  return `gap-${spacing}`
}

export function convertPadding(value: string): string[] {
  const parts = value.split(/\s+/)
  const classes: string[] = []

  if (parts.length === 1) {
    const px = parseFloat(parts[0])
    if (!isNaN(px)) classes.push(`p-${pxToSpacing(px)}`)
  } else if (parts.length === 2) {
    const py = parseFloat(parts[0])
    const px = parseFloat(parts[1])
    if (!isNaN(py) && !isNaN(px)) {
      const sy = pxToSpacing(py)
      const sx = pxToSpacing(px)
      if (sy === sx) {
        classes.push(`p-${sy}`)
      } else {
        classes.push(`py-${sy}`, `px-${sx}`)
      }
    }
  } else if (parts.length === 4) {
    const [top, right, bottom, left] = parts.map(parseFloat)
    if ([top, right, bottom, left].every(v => !isNaN(v))) {
      const st = pxToSpacing(top)
      const sr = pxToSpacing(right)
      const sb = pxToSpacing(bottom)
      const sl = pxToSpacing(left)
      if (st === sr && sr === sb && sb === sl) {
        classes.push(`p-${st}`)
      } else {
        if (st === sb) classes.push(`py-${st}`)
        else classes.push(`pt-${st}`, `pb-${sb}`)
        if (sl === sr) classes.push(`px-${sl}`)
        else classes.push(`pl-${sl}`, `pr-${sr}`)
      }
    }
  }

  return classes
}

export function convertMargin(value: string): string[] {
  return convertPadding(value).map(cls => cls.replace(/^p/, 'm'))
}

export function convertWidth(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = Math.round(parseFloat(match[1]))
  // 宽高始终用 [Npx]，避免非标准 unit 值（如 w-93.75）在 UnoCSS 中失效
  return `w-[${px}px]`
}

export function convertHeight(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = Math.round(parseFloat(match[1]))
  return `h-[${px}px]`
}

export function convertColor(value: string): string | null {
  if (value === '#ffffff' || value === 'rgb(255, 255, 255)') return 'bg-white'
  if (value === '#000000' || value === 'rgb(0, 0, 0)') return 'bg-black'
  if (value.startsWith('#') || value.startsWith('rgb')) return `bg-[${value}]`
  return null
}

export function convertTextColor(value: string): string | null {
  const color = convertColor(value)
  if (!color) return null
  return color.replace(/^bg-/, 'text-')
}

export function convertBorderRadius(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = parseFloat(match[1])
  if (px === 0) return null
  return `rounded-${pxToSpacing(px)}`
}

export function convertFontSize(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = parseFloat(match[1])
  const sizeMap: Record<number, string> = {
    12: 'text-xs',
    14: 'text-sm',
    16: 'text-base',
    18: 'text-lg',
    20: 'text-xl',
    24: 'text-2xl',
    30: 'text-3xl',
    36: 'text-4xl',
  }
  return sizeMap[px] ?? `text-[${px}px]`
}

export function convertFontWeight(value: string): string | null {
  const weightMap: Record<string, string> = {
    '100': 'font-thin',
    '200': 'font-extralight',
    '300': 'font-light',
    '400': 'font-normal',
    '500': 'font-medium',
    '600': 'font-semibold',
    '700': 'font-bold',
    '800': 'font-extrabold',
    '900': 'font-black'
  }
  return weightMap[value] || null
}

export function convertTextAlign(value: string): string | null {
  const alignMap: Record<string, string> = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
    'justify': 'text-justify'
  }
  return alignMap[value] || null
}

export function convertLineHeight(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = parseFloat(match[1])
  const leadingMap: Record<number, string> = {
    16: 'leading-4',
    20: 'leading-5',
    22: 'leading-[22px]',
    24: 'leading-6',
    28: 'leading-7',
    32: 'leading-8',
    36: 'leading-9',
    40: 'leading-10',
  }
  return leadingMap[Math.round(px)] ?? `leading-[${Math.round(px)}px]`
}

/** 将 border-width / border-color / border-style 合并为 UnoCSS border 类 */
export function convertBorderProps(
  width: string | undefined,
  color: string | undefined,
  style: string | undefined
): string[] {
  if (!width || width === '0px' || width === '0') return []
  const classes: string[] = []

  const wMatch = width.match(/^(\d+(?:\.\d+)?)px$/)
  if (wMatch) {
    const w = parseFloat(wMatch[1])
    classes.push(w === 1 ? 'border' : `border-[${w}px]`)
  }

  if (style && style !== 'solid') {
    classes.push(`border-${style}`)
  }

  if (color) {
    const colorClass = convertColor(color)
    if (colorClass) {
      classes.push(colorClass.replace(/^bg-/, 'border-'))
    } else {
      classes.push(`border-[${color}]`)
    }
  }

  return classes
}
