import {
  DISPLAY_MAPPINGS,
  FLEX_DIRECTION_MAPPINGS,
  ALIGN_ITEMS_MAPPINGS,
  JUSTIFY_CONTENT_MAPPINGS,
  convertSpacing,
  convertGap,
  convertPadding,
  convertMargin,
  convertWidth,
  convertHeight,
  convertColor,
  convertTextColor,
  convertBorderRadius,
  convertFontSize,
  convertFontWeight,
  convertTextAlign,
  convertLineHeight,
  convertBorderProps
} from './mappings'

// 全局设置的字体属性，不需要内联
const SKIP_PROPS = new Set([
  'font-family',
  'text-decoration',
  'text-transform',
])

export function convertCSSToUnoCSS(css: Record<string, string>): {
  classes: string[]
  remainingStyles: Record<string, string>
} {
  const classes: string[] = []
  const remainingStyles: Record<string, string> = {}

  // 预先提取 border 相关属性，合并处理
  const borderWidth = css['border-width']
  const borderColor = css['border-color']
  const borderStyle = css['border-style']
  const hasBorder = borderWidth || borderColor || borderStyle

  if (hasBorder) {
    const borderClasses = convertBorderProps(borderWidth, borderColor, borderStyle)
    classes.push(...borderClasses)
  }

  for (const [key, value] of Object.entries(css)) {
    // border 属性已合并处理，跳过
    if (key === 'border-width' || key === 'border-color' || key === 'border-style') continue

    // 全局字体属性，直接丢弃
    if (SKIP_PROPS.has(key)) continue

    // letter-spacing 为 0 时无意义，丢弃
    if (key === 'letter-spacing' && (value === '0px' || value === '0')) continue

    let converted = false

    switch (key) {
      case 'display':
        if (DISPLAY_MAPPINGS[value]) { classes.push(DISPLAY_MAPPINGS[value]); converted = true }
        break

      case 'flex-direction':
        if (FLEX_DIRECTION_MAPPINGS[value]) { classes.push(FLEX_DIRECTION_MAPPINGS[value]); converted = true }
        break

      case 'align-items':
        if (ALIGN_ITEMS_MAPPINGS[value]) { classes.push(ALIGN_ITEMS_MAPPINGS[value]); converted = true }
        break

      case 'justify-content':
        if (JUSTIFY_CONTENT_MAPPINGS[value]) { classes.push(JUSTIFY_CONTENT_MAPPINGS[value]); converted = true }
        break

      case 'gap': {
        const cls = convertGap(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'padding': {
        const clsList = convertPadding(value)
        if (clsList.length > 0) { classes.push(...clsList); converted = true }
        break
      }

      case 'padding-top': {
        const cls = convertSpacing(value)
        if (cls) { classes.push(cls.replace(/^p-/, 'pt-')); converted = true }
        break
      }

      case 'padding-right': {
        const cls = convertSpacing(value)
        if (cls) { classes.push(cls.replace(/^p-/, 'pr-')); converted = true }
        break
      }

      case 'padding-bottom': {
        const cls = convertSpacing(value)
        if (cls) { classes.push(cls.replace(/^p-/, 'pb-')); converted = true }
        break
      }

      case 'padding-left': {
        const cls = convertSpacing(value)
        if (cls) { classes.push(cls.replace(/^p-/, 'pl-')); converted = true }
        break
      }

      case 'margin': {
        const clsList = convertMargin(value)
        if (clsList.length > 0) { classes.push(...clsList); converted = true }
        break
      }

      case 'width': {
        const cls = convertWidth(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'height': {
        const cls = convertHeight(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'background-color': {
        const cls = convertColor(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'color': {
        const cls = convertTextColor(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'border-radius': {
        const cls = convertBorderRadius(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'font-size': {
        const cls = convertFontSize(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'font-weight': {
        const cls = convertFontWeight(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'text-align': {
        const cls = convertTextAlign(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'line-height': {
        const cls = convertLineHeight(value)
        if (cls) { classes.push(cls); converted = true }
        break
      }

      case 'letter-spacing': {
        // 非零 letter-spacing 用 tracking-[Npx]
        const match = value.match(/^(-?\d+(?:\.\d+)?)px$/)
        if (match) {
          const px = parseFloat(match[1])
          classes.push(`tracking-[${px}px]`)
          converted = true
        }
        break
      }

      case 'opacity': {
        if (value === '0') { classes.push('opacity-0'); converted = true }
        else if (value === '1') { classes.push('opacity-100'); converted = true }
        else {
          const opacity = parseFloat(value)
          if (!isNaN(opacity)) { classes.push(`opacity-${Math.round(opacity * 100)}`); converted = true }
        }
        break
      }
    }

    if (!converted) {
      remainingStyles[key] = value
    }
  }

  return { classes, remainingStyles }
}
