export interface UnoCSSMapping {
  pattern: RegExp | string
  class: string | ((value: string) => string)
}

// 保留原始 px 值，供项目层（figma-context.md + skill）按自身规则换算
function rawPx(value: string): string | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (!match) return null
  const px = Math.round(parseFloat(match[1]))
  return px === 0 ? '0' : `[${px}px]`
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
  const raw = rawPx(value)
  return raw ? `p-${raw}` : null
}

export function convertGap(value: string): string | null {
  const raw = rawPx(value)
  return raw ? `gap-${raw}` : null
}

export function convertPadding(value: string): string[] {
  const parts = value.split(/\s+/)
  const classes: string[] = []

  if (parts.length === 1) {
    const raw = rawPx(parts[0])
    if (raw) classes.push(`p-${raw}`)
  } else if (parts.length === 2) {
    const ry = rawPx(parts[0])
    const rx = rawPx(parts[1])
    if (ry && rx) {
      if (ry === rx) classes.push(`p-${ry}`)
      else classes.push(`py-${ry}`, `px-${rx}`)
    }
  } else if (parts.length === 4) {
    const raws = parts.map(rawPx)
    if (raws.every(Boolean)) {
      const [rt, rr, rb, rl] = raws as string[]
      if (rt === rr && rr === rb && rb === rl) {
        classes.push(`p-${rt}`)
      } else {
        if (rt === rb) classes.push(`py-${rt}`)
        else classes.push(`pt-${rt}`, `pb-${rb}`)
        if (rl === rr) classes.push(`px-${rl}`)
        else classes.push(`pl-${rl}`, `pr-${rr}`)
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
  // 保留 CSS Variable（含 Figma 别名），让 AI 根据变量名映射项目 token
  if (value.startsWith('var(')) return `bg-[${value}]`
  return null
}

export function convertTextColor(value: string): string | null {
  const color = convertColor(value)
  if (!color) return null
  return color.replace(/^bg-/, 'text-')
}

export function convertBorderRadius(value: string): string | null {
  const raw = rawPx(value)
  if (!raw || raw === '0') return null
  return `rounded-${raw}`
}

export function convertFontSize(value: string): string | null {
  const raw = rawPx(value)
  return raw ? `text-${raw}` : null
}

export function convertFontWeight(value: string): string | null {
  if (!value || value === '0') return null
  return `font-[${value}]`
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
  const raw = rawPx(value)
  return raw ? `leading-${raw}` : null
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
