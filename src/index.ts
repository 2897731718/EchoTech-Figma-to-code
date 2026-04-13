export { readFigmaPAT, readPATFromEnv, readPATFromKeychain } from './pat/reader'

export { FigmaAPIClient } from './api/client'

export type {
  FileResponse,
  Node,
  NodeType,
  Paint,
  PaintType,
  RGB,
  Rect,
  Transform,
  Constraints,
  Component,
  ComponentSet,
  Style,
  Variable,
  VariableValue,
  VariableScope,
  ComponentsResponse,
  StylesResponse,
  VariablesResponse,
  MeResponse,
  TypeStyle,
  Effect,
  BlendMode
} from './api/types'

export {
  convertFigmaToCode,
  type ConvertOptions,
  type ConvertResult,
  type InstanceComponent
} from './converter'

export type { Framework, StyleFormat, ComponentNode } from './converter/generators/types'
export { createGenerator } from './converter/generators/generator-factory'
export { createStyleConverter } from './converter/styles/converter-factory'

export {
  convertAutoLayout,
  calculateConstraints,
  type FrameNode
} from './converter/layout'

export { type ParsedStyles } from './converter/generators/style-parser'
export { extractParsedStyles } from './converter/tree-builder'
export { loadAnnotationMap, buildComponentClassNameMap } from './converter/annotation'

export {
  convertFillsToBackgroundColor,
  convertStrokesToBorder,
  convertCornerRadius,
  convertRectangleCornerRadii
} from './converter/styles'

export { rgbToHex, rgbToRgba, convertPaintToColor } from './converter/colors'
