import { describe, expect, it } from 'vitest'
import { HTMLGenerator } from '../src/converter/generators/html-generator'
import { VueGenerator } from '../src/converter/generators/vue-generator'
import { ReactGenerator } from '../src/converter/generators/react-generator'
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
