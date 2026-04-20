export interface FileResponse {
  name: string
  role: string
  lastModified: string
  editorType: string
  thumbnailUrl: string
  version: string
  document: Node
  components: Record<string, Component>
  componentSets: Record<string, ComponentSet>
  schemaVersion: number
  styles: Record<string, Style>
  mainFileKey?: string
  branches?: Branch[]
}

export interface Branch {
  key: string
  name: string
  thumbnail_url: string
  last_modified: string
  link_access: string
}

export type NodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'

export interface Node {
  id: string
  name: string
  type: NodeType
  visible?: boolean
  rotation?: number
  pluginData?: unknown
  sharedPluginData?: unknown
  componentId?: string
  componentProperties?: Record<string, ComponentProperty>
  componentPropertyReferences?: Record<string, string>
  boundVariables?: Record<string, VariableAlias>
  explicitVariableModes?: Record<string, string>
  children?: Node[]
  absoluteBoundingBox?: Rect
  relativeTransform?: Transform
  fills?: Paint[]
  strokes?: Paint[]
  strokeWeight?: number
  cornerRadius?: number
  rectangleCornerRadii?: [number, number, number, number]
  characters?: string
  style?: TypeStyle
  characterStyleOverrides?: number[]
  styleOverrideTable?: Record<number, TypeStyle>
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  layoutWrap?: 'NO_WRAP' | 'WRAP'
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  layoutGrow?: number
  layoutPositioning?: 'AUTO' | 'ABSOLUTE'
  constraints?: Constraints
  effects?: Effect[]
  opacity?: number
  blendMode?: BlendMode
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type Transform = [[number, number, number], [number, number, number]]

export interface Constraints {
  horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE'
  vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE'
}

export type PaintType = 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI'

export interface Paint {
  type: PaintType
  visible?: boolean
  opacity?: number
  color?: RGB
  blendMode?: BlendMode
  gradientStops?: ColorStop[]
  gradientHandlePositions?: Vector[]
  imageRef?: string
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE'
  imageTransform?: Transform
  imageHash?: string
  boundVariables?: Record<string, VariableAlias>
}

export interface RGB {
  r: number
  g: number
  b: number
  a?: number
}

export interface ColorStop {
  position: number
  color: RGB
}

export interface Vector {
  x: number
  y: number
}

export type BlendMode =
  | 'NORMAL'
  | 'MULTIPLY'
  | 'SCREEN'
  | 'OVERLAY'
  | 'DARKEN'
  | 'LIGHTEN'
  | 'COLOR_DODGE'
  | 'COLOR_BURN'
  | 'HARD_LIGHT'
  | 'SOFT_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY'

export interface Effect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'
  visible?: boolean
  radius?: number
  color?: RGB
  offset?: Vector
  spread?: number
}

export interface TypeStyle {
  fontFamily?: string
  fontPostScriptName?: string
  paragraphSpacing?: number
  paragraphIndent?: number
  listOptions?: unknown
  italic?: boolean
  fontWeight?: number
  fontSize?: number
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE'
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'
  textAutoResize?: 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE' | 'NONE'
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM'
  letterSpacing?: number | { value: number; unit: 'PIXELS' | 'PERCENT' }
  fills?: Paint[]
  lineHeightPx?: number
  lineHeightPercent?: number
  lineHeightPercentFontSize?: number
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%'
}

export interface ComponentProperty {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT'
  value: string | boolean
  boundVariables?: Record<string, unknown>
  preferredValues?: Array<{ type: string; key: string }>
}

export interface Component {
  key: string
  name: string
  description?: string
  componentSetId?: string
  documentationLinks?: DocumentationLink[]
}

export interface ComponentSet {
  key: string
  name: string
  description?: string
  documentationLinks?: DocumentationLink[]
}

export interface DocumentationLink {
  uri: string
}

export interface Style {
  key: string
  name: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  description?: string
}

export interface VariableAlias {
  type: 'VARIABLE_ALIAS'
  id: string
}

export interface Variable {
  id: string
  name: string
  description?: string
  type: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR'
  valuesByMode: Record<string, VariableValue>
  variableCollectionId: string
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR'
  hiddenFromPublishing?: boolean
  scopes: VariableScope[]
  codeSyntax?: Record<string, string>
}

export type VariableValue = string | number | boolean | RGB | VariableAlias

export type VariableScope = 'ALL_SCOPES' | 'TEXT_CONTENT' | 'CORNER_RADIUS' | 'WIDTH_HEIGHT' | 'GAP' | 'ALL_FILLS' | 'FRAME_FILL' | 'SHAPE_FILL' | 'TEXT_FILL' | 'STROKE_COLOR' | 'OPACITY' | 'STROKE_WEIGHT' | 'FONT_FAMILY' | 'FONT_SIZE' | 'FONT_WEIGHT' | 'LINE_HEIGHT' | 'LETTER_SPACING'

export interface ComponentsResponse {
  meta: {
    components: Record<string, Component>
    componentSets: Record<string, ComponentSet>
  }
  status: number
  err?: string
}

export interface StylesResponse {
  meta: {
    styles: Record<string, Style>
  }
  status: number
  err?: string
}

export interface VariablesResponse {
  meta: {
    variables: Record<string, Variable>
    variableCollections: Record<string, VariableCollection>
  }
  status: number
  err?: string
}

export interface VariableCollection {
  id: string
  name: string
  modes: VariableMode[]
  defaultModeId: string
  hiddenFromPublishing?: boolean
  key: string
}

export interface VariableMode {
  modeId: string
  name: string
}

export interface MeResponse {
  id: string
  email: string
  username: string
  img_url: string
  handle: string
}
