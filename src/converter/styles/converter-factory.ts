import type { StyleFormat, StyleConverter } from '../generators/types'
import { CSSConverter } from './css-converter'
import { UnoCSSConverter } from './unocss-converter'
import { InlineConverter } from './inline-converter'

export function createStyleConverter(styleFormat: StyleFormat): StyleConverter {
  switch (styleFormat) {
    case 'css':
      return new CSSConverter()
    case 'unocss':
      return new UnoCSSConverter()
    case 'inline':
      return new InlineConverter()
    default:
      return new CSSConverter()
  }
}
