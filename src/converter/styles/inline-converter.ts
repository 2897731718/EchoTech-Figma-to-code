import type { StyleConverter } from '../generators/types'

export class InlineConverter implements StyleConverter {
  convert(css: Record<string, string>, nodeId: string): {
    className?: string
    style?: Record<string, string>
    classes?: string[]
  } {
    if (Object.keys(css).length === 0) {
      return {}
    }

    return {
      style: css
    }
  }
}
