import type { StyleConverter } from '../generators/types'
import { convertCSSToUnoCSS } from '../unocss/converter'

export class UnoCSSConverter implements StyleConverter {
  convert(css: Record<string, string>, nodeId: string): {
    className?: string
    style?: Record<string, string>
    classes?: string[]
  } {
    if (Object.keys(css).length === 0) {
      return {}
    }

    const { classes, remainingStyles } = convertCSSToUnoCSS(css)

    const result: {
      className?: string
      style?: Record<string, string>
      classes?: string[]
    } = {}

    if (classes.length > 0) {
      result.classes = classes
    }

    if (Object.keys(remainingStyles).length > 0) {
      result.style = remainingStyles
    }

    return result
  }
}
