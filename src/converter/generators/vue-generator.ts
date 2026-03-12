import type { CodeGenerator, ComponentNode } from './types'

export class VueGenerator implements CodeGenerator {
  generate(
    componentTree: ComponentNode,
    styles: Record<string, string>,
    tokens?: Record<string, { kind: string; value: string | Record<string, string> }>
  ): string {
    const template = this.generateTemplate(componentTree)
    const script = this.generateScript()
    const styleBlock = this.generateStyle(styles)

    return `${script}\n\n<template>\n${template}\n</template>${styleBlock}`
  }

  private generateScript(): string {
    return '<script setup lang="ts">\n// Component logic\n</script>'
  }

  private generateTemplate(node: ComponentNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    const attrs: string[] = []

    if (node.className) {
      attrs.push(`class="${node.className}"`)
    }

    if (node.style && Object.keys(node.style).length > 0) {
      const styleEntries = Object.entries(node.style)
        .map(([key, value]) => {
          const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          return `${camelKey}: '${value}'`
        })
        .join(', ')
      attrs.push(`:style="{ ${styleEntries} }"`)
    }

    const attrsStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : ''

    if (node.text !== undefined) {
      return `${indent}<${node.tag}${attrsStr}>${node.text}</${node.tag}>`
    }

    if (!node.children || node.children.length === 0) {
      return `${indent}<${node.tag}${attrsStr} />`
    }

    let code = `${indent}<${node.tag}${attrsStr}>\n`
    for (const child of node.children) {
      code += `${this.generateTemplate(child, depth + 1)}\n`
    }
    code += `${indent}</${node.tag}>`

    return code
  }

  private generateStyle(styles: Record<string, string>): string {
    if (Object.keys(styles).length === 0) {
      return ''
    }

    const cssLines: string[] = ['<style scoped>']
    for (const [className, cssText] of Object.entries(styles)) {
      cssLines.push(`.${className} {`)
      cssLines.push(cssText)
      cssLines.push('}')
      cssLines.push('')
    }
    cssLines.push('</style>')
    
    return '\n\n' + cssLines.join('\n')
  }
}
