export type Framework = 'html' | 'vue' | 'react'
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
