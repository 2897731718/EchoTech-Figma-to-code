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
  /** INSTANCE 组件属性（变体、文字、开关等，折叠时提取） */
  componentProps?: Record<string, { type: string; value: string | boolean }>
  /** Figma 节点语义名（如 "💙 02.08_Stepper"），INSTANCE/COMPONENT 节点保留 */
  semanticName?: string
  /** 是否 flex-1（layoutGrow=1，对应 Flutter Expanded） */
  isExpanded?: boolean
  /** 矢量图标容器（children 全为 VECTOR，已折叠） */
  isVectorIcon?: boolean
  /** 图标名（从节点名提取，kebab-case） */
  iconName?: string
  /** 横滑容器（子元素总宽超过容器宽） */
  isScrollContainer?: boolean
  /** 横滑容器的滚动轴（目前只支持 'horizontal'） */
  scrollAxis?: 'horizontal' | 'vertical'
  /** Figma auto-layout wrap（用于识别 GridView） */
  layoutWrap?: 'NO_WRAP' | 'WRAP'
  /** 来自 annotation_config 的组件文档链接（external wiki / GitLab 源码） */
  componentDocLink?: string
  /** 折叠前从 INSTANCE 子节点抽取的 TEXT 内容（设计师的直接覆盖，不走 componentProperties） */
  instanceTextOverrides?: Array<{ name?: string; text: string }>
  /** 折叠前从 INSTANCE 子节点抽取的嵌套组件（如 NavigationBar 内的 SearchBar） */
  nestedInstances?: Array<{ name: string; slot?: string; componentId?: string }>
  /** 是 INSTANCE/COMPONENT 但未在 annotation_config 命中映射（tag 走 Figma 节点名降级） */
  isUnmappedInstance?: boolean
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
