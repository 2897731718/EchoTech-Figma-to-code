import type { CodeGenerator, ComponentNode } from './types'

export class ReactGenerator implements CodeGenerator {
  generate(
    componentTree: ComponentNode,
    styles: Record<string, string>,
    tokens?: Record<string, { kind: string; value: string | Record<string, string> }>
  ): string {
    const componentName = this.getComponentName(componentTree)
    const jsx = this.generateJSX(componentTree, 2)
    const stylesImport = this.generateStylesImport(styles)

    return `${stylesImport}\n\nexport function ${componentName}() {\n  return (\n${jsx}\n  )\n}`
  }

  private getComponentName(node: ComponentNode): string {
    return 'Component'
  }

  private generateJSX(node: ComponentNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    const attrs: string[] = []

    if (node.className) {
      attrs.push(`className="${node.className}"`)
    }

    if (node.style && Object.keys(node.style).length > 0) {
      const styleObj = JSON.stringify(node.style)
      attrs.push(`style={${styleObj}}`)
    }

    const attrsStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : ''

    if (node.text !== undefined) {
      const content = node.i18nKey ? `{t('${node.i18nKey}')}` : node.text
      return `${indent}<${node.tag}${attrsStr}>${content}</${node.tag}>`
    }

    if (!node.children || node.children.length === 0) {
      // 矢量图标容器 → 输出 Icon 组件
      if (node.isVectorIcon && node.iconName) {
        const size = node.parsedStyles?.width ?? node.parsedStyles?.height
        const sizeAttr = size ? ` size={${size}}` : ''
        return `${indent}<Icon name="${node.iconName}"${sizeAttr} />`
      }
      return `${indent}<${node.tag}${attrsStr} />`
    }

    let code = `${indent}<${node.tag}${attrsStr}>\n`
    for (const child of node.children) {
      code += `${this.generateJSX(child, depth + 1)}\n`
    }
    code += `${indent}</${node.tag}>`

    return code
  }

  private generateStylesImport(styles: Record<string, string>): string {
    if (Object.keys(styles).length === 0) {
      return ''
    }

    const cssLines: string[] = []
    for (const [className, cssText] of Object.entries(styles)) {
      cssLines.push(`.${className} {`)
      cssLines.push(cssText)
      cssLines.push('}')
      cssLines.push('')
    }

    return `import './styles.css'\n\n// styles.css\n${cssLines.join('\n')}`
  }
}
