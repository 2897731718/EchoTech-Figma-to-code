import type { Framework, StyleFormat, ComponentNode } from './generators/types'

export const CONTEXT_SCHEMA_VERSION = 'figma-ai-context/v1' as const

export interface ContextSourceV1 {
  provider: 'figma'
  nodeId?: string
  nodeName?: string
  nodeType?: string
}

export interface ContextLayoutV1 {
  direction: 'row' | 'column' | 'grid'
  gap?: number
  justify?: 'start' | 'center' | 'end' | 'space-between'
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
}

export interface ContextPaddingV1 {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ContextBorderRadiusV1 {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export interface ContextBorderV1 {
  width: number
  color: string
  style: string
}

export interface ContextTextStyleV1 {
  color?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: string
  fontFamily?: string
  fontStyle?: string
  textDecoration?: string
  textTransform?: string
}

export interface ContextParsedStylesV1 {
  layout?: ContextLayoutV1
  padding?: ContextPaddingV1
  width?: number | string
  height?: number | string
  backgroundColor?: string
  borderRadius?: ContextBorderRadiusV1
  border?: ContextBorderV1
  opacity?: number
  position?: 'absolute'
  positionOffsets?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  text?: ContextTextStyleV1
}

export interface ContextStylesV1 {
  className?: string
  inline?: Record<string, string>
  parsed?: ContextParsedStylesV1
}

export interface ContextComponentPropV1 {
  type: string
  value: string | boolean
}

export interface ContextPropsV1 {
  attributes?: Record<string, string>
  component?: Record<string, ContextComponentPropV1>
}

export interface ContextTextOverrideV1 {
  name?: string
  text: string
}

export interface ContextNestedInstanceV1 {
  name: string
  slot?: string
  componentId?: string
}

/**
 * Versioned, framework-independent DTO exposed to AI consumers.
 *
 * Keep this separate from ComponentNode so internal generator fields can evolve
 * without silently changing the external context contract.
 */
export interface DesignNodeV1 {
  tag: string
  nodeId?: string
  figmaType?: string
  figmaName?: string
  semanticName?: string
  componentId?: string
  text?: string
  i18nKey?: string
  styles?: ContextStylesV1
  props?: ContextPropsV1
  textOverrides?: ContextTextOverrideV1[]
  nestedInstances?: ContextNestedInstanceV1[]
  unmappedComponent: boolean
  isVectorIcon?: boolean
  iconName?: string
  isExpanded?: boolean
  isScrollContainer?: boolean
  scrollAxis?: 'horizontal' | 'vertical'
  layoutWrap?: 'NO_WRAP' | 'WRAP'
  componentDocLink?: string
  children?: DesignNodeV1[]
}

export interface ContextComponentV1 {
  tag: string
  nodeId?: string
  figmaType?: string
  figmaName?: string
  semanticName?: string
  componentId: string
  props?: ContextPropsV1
  textOverrides?: ContextTextOverrideV1[]
  nestedInstances?: ContextNestedInstanceV1[]
  unmapped: boolean
}

export interface ContextDiagnosticV1 {
  code: 'unmapped-component' | 'unresolved-icon'
  severity: 'warning'
  message: string
  nodeId?: string
}

export interface ContextPreviewV1 {
  kind: 'reference-only'
  framework: Framework
  styleFormat: StyleFormat
  code: string
  styles: Record<string, string>
}

export interface ConversionContextV1 {
  schemaVersion: typeof CONTEXT_SCHEMA_VERSION
  source: ContextSourceV1
  designTree: DesignNodeV1
  components: ContextComponentV1[]
  diagnostics: ContextDiagnosticV1[]
  preview: ContextPreviewV1
}

export interface CreateConversionContextOptions {
  componentTree: ComponentNode
  framework: Framework
  styleFormat: StyleFormat
  code: string
  styles: Record<string, string>
}

function cloneRecord<T>(value: Record<string, T> | undefined): Record<string, T> | undefined {
  if (!value || Object.keys(value).length === 0) return undefined
  return { ...value }
}

function serializeStyles(node: ComponentNode): ContextStylesV1 | undefined {
  const styles: ContextStylesV1 = {}

  if (node.className) styles.className = node.className
  if (node.style && Object.keys(node.style).length > 0) styles.inline = { ...node.style }

  if (node.parsedStyles && Object.keys(node.parsedStyles).length > 0) {
    const parsed = node.parsedStyles
    styles.parsed = {
      ...parsed,
      ...(parsed.layout ? { layout: { ...parsed.layout } } : {}),
      ...(parsed.padding ? { padding: { ...parsed.padding } } : {}),
      ...(parsed.borderRadius ? { borderRadius: { ...parsed.borderRadius } } : {}),
      ...(parsed.border ? { border: { ...parsed.border } } : {}),
      ...(parsed.positionOffsets ? { positionOffsets: { ...parsed.positionOffsets } } : {}),
      ...(parsed.text ? { text: { ...parsed.text } } : {}),
    }
  }

  return Object.keys(styles).length > 0 ? styles : undefined
}

function serializeProps(node: ComponentNode): ContextPropsV1 | undefined {
  const attributes = cloneRecord(node.props)
  const component = node.componentProps
    ? Object.fromEntries(
        Object.entries(node.componentProps).map(([key, value]) => [key, { ...value }])
      )
    : undefined

  if (!attributes && (!component || Object.keys(component).length === 0)) return undefined

  return {
    ...(attributes ? { attributes } : {}),
    ...(component && Object.keys(component).length > 0 ? { component } : {}),
  }
}

function serializeTextOverrides(node: ComponentNode): ContextTextOverrideV1[] | undefined {
  if (!node.instanceTextOverrides?.length) return undefined
  return node.instanceTextOverrides.map(item => ({ ...item }))
}

function serializeNestedInstances(node: ComponentNode): ContextNestedInstanceV1[] | undefined {
  if (!node.nestedInstances?.length) return undefined
  return node.nestedInstances.map(item => ({ ...item }))
}

function serializeNode(node: ComponentNode): DesignNodeV1 {
  const children = node.children?.map(serializeNode)
  const styles = serializeStyles(node)
  const props = serializeProps(node)
  const textOverrides = serializeTextOverrides(node)
  const nestedInstances = serializeNestedInstances(node)

  return {
    tag: node.tag,
    ...(node.nodeId ? { nodeId: node.nodeId } : {}),
    ...(node.figmaType ? { figmaType: node.figmaType } : {}),
    ...(node.figmaName ? { figmaName: node.figmaName } : {}),
    ...(node.semanticName ? { semanticName: node.semanticName } : {}),
    ...(node.componentId ? { componentId: node.componentId } : {}),
    ...(node.text !== undefined ? { text: node.text } : {}),
    ...(node.i18nKey ? { i18nKey: node.i18nKey } : {}),
    ...(styles ? { styles } : {}),
    ...(props ? { props } : {}),
    ...(textOverrides ? { textOverrides } : {}),
    ...(nestedInstances ? { nestedInstances } : {}),
    unmappedComponent: node.isUnmappedInstance === true,
    ...(node.isVectorIcon !== undefined ? { isVectorIcon: node.isVectorIcon } : {}),
    ...(node.iconName ? { iconName: node.iconName } : {}),
    ...(node.isExpanded !== undefined ? { isExpanded: node.isExpanded } : {}),
    ...(node.isScrollContainer !== undefined ? { isScrollContainer: node.isScrollContainer } : {}),
    ...(node.scrollAxis ? { scrollAxis: node.scrollAxis } : {}),
    ...(node.layoutWrap ? { layoutWrap: node.layoutWrap } : {}),
    ...(node.componentDocLink ? { componentDocLink: node.componentDocLink } : {}),
    ...(children && children.length > 0 ? { children } : {}),
  }
}

function collectContextMetadata(
  node: DesignNodeV1,
  components: ContextComponentV1[],
  diagnostics: ContextDiagnosticV1[]
): void {
  if (node.componentId) {
    components.push({
      tag: node.tag,
      ...(node.nodeId ? { nodeId: node.nodeId } : {}),
      ...(node.figmaType ? { figmaType: node.figmaType } : {}),
      ...(node.figmaName ? { figmaName: node.figmaName } : {}),
      ...(node.semanticName ? { semanticName: node.semanticName } : {}),
      componentId: node.componentId,
      ...(node.props ? { props: node.props } : {}),
      ...(node.textOverrides ? { textOverrides: node.textOverrides } : {}),
      ...(node.nestedInstances ? { nestedInstances: node.nestedInstances } : {}),
      unmapped: node.unmappedComponent,
    })
  }

  if (node.unmappedComponent) {
    diagnostics.push({
      code: 'unmapped-component',
      severity: 'warning',
      message: 'No project component mapping is available for this design component.',
      ...(node.nodeId ? { nodeId: node.nodeId } : {}),
    })
  }

  if (node.isVectorIcon && node.iconName?.startsWith('icon-todo--')) {
    diagnostics.push({
      code: 'unresolved-icon',
      severity: 'warning',
      message: 'The icon name could not be resolved automatically.',
      ...(node.nodeId ? { nodeId: node.nodeId } : {}),
    })
  }

  for (const child of node.children ?? []) {
    collectContextMetadata(child, components, diagnostics)
  }
}

export function createConversionContext(options: CreateConversionContextOptions): ConversionContextV1 {
  const designTree = serializeNode(options.componentTree)
  const components: ContextComponentV1[] = []
  const diagnostics: ContextDiagnosticV1[] = []

  collectContextMetadata(designTree, components, diagnostics)

  return {
    schemaVersion: CONTEXT_SCHEMA_VERSION,
    source: {
      provider: 'figma',
      ...(designTree.nodeId ? { nodeId: designTree.nodeId } : {}),
      ...(designTree.figmaName ? { nodeName: designTree.figmaName } : {}),
      ...(designTree.figmaType ? { nodeType: designTree.figmaType } : {}),
    },
    designTree,
    components,
    diagnostics,
    preview: {
      kind: 'reference-only',
      framework: options.framework,
      styleFormat: options.styleFormat,
      code: options.code,
      styles: { ...options.styles },
    },
  }
}
