import { describe, expect, it } from 'vitest'
import { HTMLGenerator } from '../src/converter/generators/html-generator'
import { VueGenerator } from '../src/converter/generators/vue-generator'
import { ReactGenerator } from '../src/converter/generators/react-generator'
import { parseStyles } from '../src/converter/generators/style-parser'
import type { ComponentNode } from '../src/converter/generators/types'

describe('Code Generators', () => {
  const mockComponentTree: ComponentNode = {
    tag: 'div',
    className: 'flex flex-col gap-2 p-4',
    children: [
      {
        tag: 'span',
        className: 'text-base font-medium',
        text: '标题'
      },
      {
        tag: 'div',
        className: 'flex items-center',
        children: []
      }
    ]
  }

  const mockStyles: Record<string, string> = {
    'node-123': '  display: flex;\n  flex-direction: column;'
  }

  describe('HTMLGenerator', () => {
    it('should generate HTML code with styles', () => {
      const generator = new HTMLGenerator()
      const code = generator.generate(mockComponentTree, mockStyles)

      expect(code).toContain('<div class="flex flex-col gap-2 p-4">')
      expect(code).toContain('<span class="text-base font-medium">标题</span>')
      expect(code).toContain('<style>')
      expect(code).toContain('.node-123')
    })
  })

  describe('VueGenerator', () => {
    it('should generate Vue component code', () => {
      const generator = new VueGenerator()
      const code = generator.generate(mockComponentTree, mockStyles)

      expect(code).toContain('<script setup lang="ts">')
      expect(code).toContain('<template>')
      expect(code).toContain('<div class="flex flex-col gap-2 p-4">')
      expect(code).toContain('<span class="text-base font-medium">标题</span>')
      expect(code).toContain('<style scoped>')
    })

    it('should handle inline styles', () => {
      const treeWithStyle: ComponentNode = {
        tag: 'div',
        style: { color: 'red', fontSize: '16px' }
      }

      const generator = new VueGenerator()
      const code = generator.generate(treeWithStyle, {})

      expect(code).toContain(':style')
    })
  })

  describe('ReactGenerator', () => {
    it('should generate React component code', () => {
      const generator = new ReactGenerator()
      const code = generator.generate(mockComponentTree, mockStyles)

      expect(code).toContain('export function Component()')
      expect(code).toContain('className="flex flex-col gap-2 p-4"')
      expect(code).toContain('className="text-base font-medium"')
      expect(code).toContain('标题')
    })

    it('should handle inline styles', () => {
      const treeWithStyle: ComponentNode = {
        tag: 'div',
        style: { color: 'red', fontSize: '16px' }
      }

      const generator = new ReactGenerator()
      const code = generator.generate(treeWithStyle, {})

      expect(code).toContain('style=')
    })
  })


})

describe('StyleParser', () => {
  it('should parse UnoCSS class names', () => {
    const node: ComponentNode = {
      tag: 'div',
      className: 'flex flex-col gap-[12px] p-[16px] bg-[#ffffff]'
    }
    const parsed = parseStyles(node)

    expect(parsed.layout).toBeDefined()
    expect(parsed.layout!.direction).toBe('column')
    expect(parsed.layout!.gap).toBe(12)
    expect(parsed.padding).toEqual({ top: 16, right: 16, bottom: 16, left: 16 })
    expect(parsed.backgroundColor).toBe('#ffffff')
  })

  it('should parse inline CSS styles', () => {
    const node: ComponentNode = {
      tag: 'div',
      style: {
        display: 'flex',
        'flex-direction': 'column',
        gap: '8px',
        padding: '16px 15px',
        'background-color': '#f5f5f5'
      }
    }
    const parsed = parseStyles(node)

    expect(parsed.layout!.direction).toBe('column')
    expect(parsed.layout!.gap).toBe(8)
    expect(parsed.padding).toEqual({ top: 16, right: 15, bottom: 16, left: 15 })
    expect(parsed.backgroundColor).toBe('#f5f5f5')
  })

  it('should parse text styles', () => {
    const node: ComponentNode = {
      tag: 'span',
      style: {
        color: '#000000',
        'font-size': '16px',
        'font-weight': '500',
        'line-height': '24px'
      }
    }
    const parsed = parseStyles(node)

    expect(parsed.text).toBeDefined()
    expect(parsed.text!.color).toBe('#000000')
    expect(parsed.text!.fontSize).toBe(16)
    expect(parsed.text!.fontWeight).toBe(500)
    expect(parsed.text!.lineHeight).toBe(24)
  })

  it('should parse border-radius with 4 values', () => {
    const node: ComponentNode = {
      tag: 'div',
      style: { 'border-radius': '15px 15px 0px 0px' }
    }
    const parsed = parseStyles(node)

    expect(parsed.borderRadius).toEqual({
      topLeft: 15, topRight: 15, bottomRight: 0, bottomLeft: 0
    })
  })

  it('should merge className and style (className wins)', () => {
    const node: ComponentNode = {
      tag: 'div',
      className: 'bg-[#ff0000]',
      style: { 'background-color': '#00ff00' }
    }
    const parsed = parseStyles(node)

    expect(parsed.backgroundColor).toBe('#ff0000')
  })

  it('should parse position absolute', () => {
    const node: ComponentNode = {
      tag: 'div',
      style: {
        position: 'absolute',
        top: '10px',
        left: '20px'
      }
    }
    const parsed = parseStyles(node)

    expect(parsed.position).toBe('absolute')
    expect(parsed.positionOffsets).toEqual({ top: '10px', left: '20px' })
  })
})
