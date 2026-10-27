import type { CodeGenerator, ComponentNode } from './types'

export class HTMLGenerator implements CodeGenerator {
  generate(
    componentTree: ComponentNode,
    styles: Record<string, string>,
    tokens?: Record<string, { kind: string; value: string | Record<string, string> }>
  ): string {
    const html = this.generateNode(componentTree, 0)
    const css = this.generateStyles(styles)
    
    return `${html}\n\n<style>\n${css}\n</style>`
  }

  private generateNode(node: ComponentNode, depth: number): string {
    const indent = '  '.repeat(depth)
    const attrs: string[] = []

    if (node.className) {
      attrs.push(`class="${node.className}"`)
    }

    if (node.style && Object.keys(node.style).length > 0) {
      const styleStr = Object.entries(node.style)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ')
      attrs.push(`style="${styleStr}"`)
    }

    const attrsStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : ''

    if (node.text !== undefined) {
      const content = node.i18nKey ? `<!-- i18n: ${node.i18nKey} -->${node.text}` : node.text
      return `${indent}<${node.tag}${attrsStr}>${content}</${node.tag}>`
    }

    if (!node.children || node.children.length === 0) {
      // 矢量图标容器 → 输出图标占位
      if (node.isVectorIcon && node.iconName) {
        const size = node.parsedStyles?.width ?? node.parsedStyles?.height ?? 16
        return `${indent}<span class="icon icon-${node.iconName}" style="font-size: ${size}px"></span>`
      }
      return `${indent}<${node.tag}${attrsStr}></${node.tag}>`
    }

    let code = `${indent}<${node.tag}${attrsStr}>\n`
    for (const child of node.children) {
      code += `${this.generateNode(child, depth + 1)}\n`
    }
    code += `${indent}</${node.tag}>`

    return code
  }

  private generateStyles(styles: Record<string, string>): string {
    const cssLines: string[] = []
    for (const [className, cssText] of Object.entries(styles)) {
      cssLines.push(`.${className} {`)
      cssLines.push(cssText)
      cssLines.push('}')
      cssLines.push('')
    }
    return cssLines.join('\n')
  }
}
