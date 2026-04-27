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
      const content = node.i18nKey ? `{{ t('${node.i18nKey}') }}` : node.text
      return `${indent}<${node.tag}${attrsStr}>${content}</${node.tag}>`
    }

    if (!node.children || node.children.length === 0) {
      // 矢量图标容器 → 直接生成 Icon
      if (node.isVectorIcon && node.iconName) {
        const size = node.parsedStyles?.width ?? node.parsedStyles?.height
        const sizeAttr = size ? ` :size="${size}"` : ''
        return `${indent}<Icon name="${node.iconName}"${sizeAttr} />`
      }

      // 折叠的 INSTANCE 节点：输出 componentProps、instanceTextOverrides、nestedInstances
      const propsFromComponent = this.generateComponentProps(node.componentProps)
      const textOverrides = node.instanceTextOverrides
      const nestedInstances = node.nestedInstances

      const comments: string[] = []
      if (node.componentId) comments.push(`figma-node: ${node.componentId}`)
      const commentStr = comments.length > 0 ? ` <!-- ${comments.join(' | ')} -->` : ''

      // 清理 slot 名：kebab-case，去除中文和特殊字符
      const cleanSlotName = (name?: string): string | undefined => {
        if (!name) return undefined
        const cleaned = name
          .replace(/[一-龥]/g, '') // 去除中文
          .replace(/[^\w\s-]/g, '') // 去除特殊字符
          .trim()
          .replace(/\s+/g, '-') // 空格转连字符
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase()
        return cleaned || undefined
      }

      // 清理组件名为 PascalCase 标签
      const cleanComponentName = (name: string): string => {
        let cleaned = name
          .replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '') // 去除开头的 emoji
          .replace(/^\d+\.\d+_/, '') // 去除数字前缀如 "01.04_"
          .replace(/\s*\/\s*/g, '') // 去除路径分隔符
          .replace(/[^\w\s-]/g, '') // 去除特殊字符
          .trim()

        // 转 PascalCase
        cleaned = cleaned
          .split(/[\s_-]+/)
          .filter(Boolean)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('')

        // 过滤无效标签名（以数字开头或为空）
        if (!cleaned || /^\d/.test(cleaned)) return ''
        return cleaned
      }

      // 生成嵌套组件的 slot 内容
      const generateNestedContent = (): string => {
        const parts: string[] = []

        // 按 slot 分组嵌套组件
        const bySlot = new Map<string, Array<{ name: string; componentId?: string }>>()
        for (const inst of nestedInstances ?? []) {
          const slot = inst.slot || 'default'
          if (!bySlot.has(slot)) bySlot.set(slot, [])
          bySlot.get(slot)!.push(inst)
        }

        // 生成每个 slot
        for (const [slot, instances] of bySlot) {
          const content = instances
            .map(inst => {
              const tag = cleanComponentName(inst.name)
              if (!tag) return '' // 过滤无效标签
              const cid = inst.componentId ? ` <!-- figma-node: ${inst.componentId} -->` : ''
              return `<${tag} />${cid}`
            })
            .filter(Boolean)
            .join('\n' + indent + '    ')

          if (!content) continue // 跳过空内容
          if (slot === 'default') {
            parts.push(content)
          } else {
            parts.push(`<template #${slot}>\n${indent}    ${content}\n${indent}  </template>`)
          }
        }

        // 添加文本覆盖
        if (textOverrides && textOverrides.length > 0) {
          for (const t of textOverrides) {
            const slotName = cleanSlotName(t.name)
            if (slotName && !bySlot.has(slotName)) {
              parts.push(`<template #${slotName}>${t.text}</template>`)
            } else if (!slotName) {
              parts.push(t.text)
            }
          }
        }

        return parts.join('\n' + indent + '  ')
      }

      // 有嵌套组件或文本覆盖时，生成带内容的标签
      if ((nestedInstances && nestedInstances.length > 0) || (textOverrides && textOverrides.length > 0)) {
        const content = generateNestedContent()
        if (content) {
          return `${indent}<${node.tag}${attrsStr}${propsFromComponent}>\n${indent}  ${content}\n${indent}</${node.tag}>${commentStr}`
        }
      }

      return `${indent}<${node.tag}${attrsStr}${propsFromComponent} />${commentStr}`
    }

    // 横滑容器注释
    const scrollComment = node.isScrollContainer
      ? `${indent}<!-- 横滑容器：小程序用 <scroll-view scroll-x>，H5 用 overflow-x-auto -->\n`
      : ''

    let code = `${scrollComment}${indent}<${node.tag}${attrsStr}>\n`
    for (const child of node.children) {
      code += `${this.generateTemplate(child, depth + 1)}\n`
    }
    code += `${indent}</${node.tag}>`

    return code
  }

  /**
   * 将 INSTANCE 的 componentProps 转为 Vue props 字符串
   * VARIANT → 普通 prop，TEXT → 普通 prop，BOOLEAN → 布尔 prop
   */
  private generateComponentProps(
    componentProps?: Record<string, { type: string; value: string | boolean }>
  ): string {
    if (!componentProps || Object.keys(componentProps).length === 0) return ''

    const props: string[] = []
    for (const [key, prop] of Object.entries(componentProps)) {
      // 清理 key：去除 emoji 前缀（如 👁️）、特殊字符，转 kebab-case
      const cleanKey = key
        .replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '') // 去除开头的 emoji 和空格
        .replace(/[^\w\s-]/g, '') // 去除其他特殊字符
        .trim()
      if (!cleanKey) continue

      const kebabKey = cleanKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

      if (prop.type === 'BOOLEAN' && prop.value === true) {
        props.push(kebabKey)
      } else if (prop.type === 'TEXT' && typeof prop.value === 'string') {
        const escaped = prop.value.replace(/"/g, '&quot;')
        props.push(`${kebabKey}="${escaped}"`)
      } else if (prop.type === 'VARIANT' && typeof prop.value === 'string') {
        props.push(`${kebabKey}="${prop.value}"`)
      }
    }

    return props.length > 0 ? ` ${props.join(' ')}` : ''
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
