export type Framework = 'html' | 'vue' | 'react' | 'flutter'
export type StyleFormat = 'css' | 'unocss' | 'inline'

export interface GeneratorOptions {
  framework: Framework
  styleFormat: StyleFormat
  indent?: number
}

export interface ComponentNode {
  tag: string
  className?: string
  style?: Record<string, string>
  children?: ComponentNode[]
  text?: string
  i18nKey?: string
  props?: Record<string, string>
  nodeId?: string
  componentId?: string
  /** 结构化样式（从 Figma 节点直接提取，移动端生成器使用） */
  parsedStyles?: import('./style-parser').ParsedStyles
}

export interface StyleConverter {
  convert(css: Record<string, string>, nodeId: string): {
    className?: string
    style?: Record<string, string>
    classes?: string[]
  }
}

export interface CodeGenerator {
  generate(
    componentTree: ComponentNode,
    styles: Record<string, string>,
    tokens?: Record<string, { kind: string; value: string | Record<string, string> }>
  ): string
}
