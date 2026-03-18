/**
 * Vue 模板生成测试
 * 验证 VueGenerator 是否正确输出 Vue SFC 结构
 */

import { describe, expect, it } from 'vitest'
import { VueGenerator } from '../src/converter/generators/vue-generator'
import type { ComponentNode } from '../src/converter/generators/types'

describe('VueGenerator 模板生成', () => {
  const generator = new VueGenerator()

  // ── SFC 结构 ────────────────────────────────────────────────────────────

  describe('SFC 基础结构', () => {
    const tree: ComponentNode = { tag: 'div', className: 'root' }

    it('包含 <script setup lang="ts">', () => {
      const code = generator.generate(tree, {})
      expect(code).toContain('<script setup lang="ts">')
      expect(code).toContain('</script>')
    })

    it('包含 <template> 块', () => {
      const code = generator.generate(tree, {})
      expect(code).toContain('<template>')
      expect(code).toContain('</template>')
    })

    it('script 在 template 之前', () => {
      const code = generator.generate(tree, {})
      expect(code.indexOf('<script')).toBeLessThan(code.indexOf('<template>'))
    })
  })

  // ── 元素生成 ────────────────────────────────────────────────────────────

  describe('元素生成', () => {
    it('单个 div，带 class', () => {
      const tree: ComponentNode = { tag: 'div', className: 'flex flex-col gap-2' }
      const code = generator.generate(tree, {})
      expect(code).toContain('<div class="flex flex-col gap-2"')
    })

    it('无子节点时输出自闭合标签', () => {
      const tree: ComponentNode = { tag: 'div', className: 'w-4 h-4', children: [] }
      const code = generator.generate(tree, {})
      expect(code).toContain('<div class="w-4 h-4" />')
    })

    it('INSTANCE 节点有 componentId 时追加 figma-node 注释', () => {
      const tree: ComponentNode = {
        tag: 'ProductCard',
        componentId: '12:345'
      }
      const code = generator.generate(tree, {})
      expect(code).toContain('<ProductCard />')
      expect(code).toContain('<!-- figma-node: 12:345 -->')
    })

    it('INSTANCE 节点无 componentId 时不输出注释', () => {
      const tree: ComponentNode = { tag: 'SomeComp' }
      const code = generator.generate(tree, {})
      expect(code).not.toContain('figma-node')
    })

    it('有子节点时正确嵌套', () => {
      const tree: ComponentNode = {
        tag: 'div',
        className: 'wrapper',
        children: [
          { tag: 'span', className: 'child', text: '内容' }
        ]
      }
      const code = generator.generate(tree, {})
      expect(code).toContain('<div class="wrapper">')
      expect(code).toContain('<span class="child">内容</span>')
      expect(code).toContain('</div>')
    })

    it('文本节点输出内联文本', () => {
      const tree: ComponentNode = { tag: 'span', text: '标题文字' }
      const code = generator.generate(tree, {})
      expect(code).toContain('<span>标题文字</span>')
    })

    it('多层嵌套结构', () => {
      const tree: ComponentNode = {
        tag: 'div',
        className: 'outer',
        children: [
          {
            tag: 'div',
            className: 'inner',
            children: [
              { tag: 'span', text: '深层文本' }
            ]
          }
        ]
      }
      const code = generator.generate(tree, {})
      expect(code).toContain('<div class="outer">')
      expect(code).toContain('<div class="inner">')
      expect(code).toContain('<span>深层文本</span>')
    })
  })

  // ── 内联样式 (:style) ───────────────────────────────────────────────────

  describe(':style 绑定', () => {
    it('输出 :style 绑定语法', () => {
      const tree: ComponentNode = {
        tag: 'span',
        style: { 'font-family': '"PingFang SC"', 'line-height': '24px' }
      }
      const code = generator.generate(tree, {})
      expect(code).toContain(':style="')
    })

    it('CSS 属性名转换为 camelCase', () => {
      const tree: ComponentNode = {
        tag: 'div',
        style: { 'font-family': '"PingFang SC"', 'letter-spacing': '0px' }
      }
      const code = generator.generate(tree, {})
      expect(code).toContain('fontFamily')
      expect(code).toContain('letterSpacing')
    })

    it('同时有 class 和 :style', () => {
      const tree: ComponentNode = {
        tag: 'span',
        className: 'text-base',
        style: { 'line-height': '24px' }
      }
      const code = generator.generate(tree, {})
      expect(code).toContain('class="text-base"')
      expect(code).toContain(':style="')
    })
  })

  // ── <style scoped> 块 ────────────────────────────────────────────────────

  describe('<style scoped> 块', () => {
    const tree: ComponentNode = { tag: 'div', className: 'root' }

    it('有 styles 时生成 <style scoped>', () => {
      const styles = { 'node-1-1': '  display: flex;\n  flex-direction: column;' }
      const code = generator.generate(tree, styles)
      expect(code).toContain('<style scoped>')
      expect(code).toContain('</style>')
    })

    it('className 前加点号', () => {
      const styles = { 'node-1-1': '  color: red;' }
      const code = generator.generate(tree, styles)
      expect(code).toContain('.node-1-1 {')
    })

    it('样式内容输出在花括号内', () => {
      const styles = { 'node-abc': '  width: 100px;\n  height: 50px;' }
      const code = generator.generate(tree, styles)
      expect(code).toContain('.node-abc {')
      expect(code).toContain('  width: 100px;')
      expect(code).toContain('  height: 50px;')
    })

    it('无 styles 时不输出 <style> 块', () => {
      const code = generator.generate(tree, {})
      expect(code).not.toContain('<style')
    })
  })

  // ── 完整 SFC 输出示例 ────────────────────────────────────────────────────

  describe('完整 SFC 输出', () => {
    it('结构顺序：script → template → style', () => {
      const tree: ComponentNode = {
        tag: 'div',
        className: 'flex flex-col',
        children: [
          { tag: 'span', text: '标题' }
        ]
      }
      const styles = { 'node-1': '  display: flex;' }
      const code = generator.generate(tree, styles)

      const scriptIdx = code.indexOf('<script')
      const templateIdx = code.indexOf('<template>')
      const styleIdx = code.indexOf('<style')

      expect(scriptIdx).toBeLessThan(templateIdx)
      expect(templateIdx).toBeLessThan(styleIdx)
    })

    it('多个子节点 + 多条样式', () => {
      const tree: ComponentNode = {
        tag: 'div',
        className: 'container',
        children: [
          { tag: 'span', className: 'title', text: '标题' },
          { tag: 'span', className: 'subtitle', text: '副标题' }
        ]
      }
      const styles = {
        'node-1': '  display: flex;',
        'node-2': '  color: #333;'
      }
      const code = generator.generate(tree, styles)

      expect(code).toContain('<span class="title">标题</span>')
      expect(code).toContain('<span class="subtitle">副标题</span>')
      expect(code).toContain('.node-1 {')
      expect(code).toContain('.node-2 {')
    })
  })
})
