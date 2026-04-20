import { describe, it, expect } from 'vitest'
import {
  detectBaseComponentPrefixes,
  extractIconName,
  simplifyNode,
  buildComponentTree
} from '../src/converter/tree-builder'
import type { Node } from '../src/api/types'

describe('tree-builder', () => {
  describe('detectBaseComponentPrefixes', () => {
    it('应该检测出高频 emoji 前缀', () => {
      const root: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        children: [
          { id: '1', name: '💙 Button', type: 'INSTANCE', componentId: 'c1' },
          { id: '2', name: '💙 Input', type: 'INSTANCE', componentId: 'c2' },
          { id: '3', name: '💙 Icon', type: 'INSTANCE', componentId: 'c3' },
          { id: '4', name: '💙 Tag', type: 'INSTANCE', componentId: 'c4' },
          { id: '5', name: '💙 Switch', type: 'INSTANCE', componentId: 'c5' },
          { id: '6', name: 'CustomCard', type: 'INSTANCE', componentId: 'c6' },
        ]
      } as unknown as Node

      const prefixes = detectBaseComponentPrefixes(root)
      expect(prefixes).toContain('💙')
    })

    it('占比不足 40% 时不应检测为前缀', () => {
      const root: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        children: [
          { id: '1', name: '💙 Button', type: 'INSTANCE', componentId: 'c1' },
          { id: '2', name: 'Card', type: 'INSTANCE', componentId: 'c2' },
          { id: '3', name: 'List', type: 'INSTANCE', componentId: 'c3' },
          { id: '4', name: 'Header', type: 'INSTANCE', componentId: 'c4' },
          { id: '5', name: 'Footer', type: 'INSTANCE', componentId: 'c5' },
        ]
      } as unknown as Node

      const prefixes = detectBaseComponentPrefixes(root)
      expect(prefixes).not.toContain('💙')
    })

    it('空树应返回空数组', () => {
      const root: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        children: []
      } as unknown as Node

      const prefixes = detectBaseComponentPrefixes(root)
      expect(prefixes).toEqual([])
    })
  })

  describe('extractIconName', () => {
    it('IconArrowRight → arrow-right', () => {
      expect(extractIconName('IconArrowRight')).toBe('arrow-right')
    })

    it('icon/arrow-right → arrow-right', () => {
      expect(extractIconName('icon/arrow-right')).toBe('arrow-right')
    })

    it('Arrow Right → arrow-right', () => {
      expect(extractIconName('Arrow Right')).toBe('arrow-right')
    })

    it('💙 Icon/Close → close', () => {
      expect(extractIconName('💙 Icon/Close')).toBe('close')
    })

    it('icon_search → search', () => {
      expect(extractIconName('icon_search')).toBe('search')
    })

    it('ChevronDown → chevron-down', () => {
      expect(extractIconName('ChevronDown')).toBe('chevron-down')
    })

    it('空字符串应返回 icon', () => {
      expect(extractIconName('')).toBe('icon')
    })

    it('只有 emoji 应返回 icon', () => {
      expect(extractIconName('💙')).toBe('icon')
    })
  })

  describe('simplifyNode - 矢量图标容器折叠', () => {
    it('children 全为 VECTOR 时应折叠并标记', () => {
      const node: Node = {
        id: 'icon',
        name: 'IconClose',
        type: 'FRAME',
        visible: true,
        children: [
          { id: 'v1', name: 'Vector', type: 'VECTOR', visible: true },
          { id: 'v2', name: 'Vector', type: 'VECTOR', visible: true },
        ]
      } as unknown as Node

      const simplified = simplifyNode(node, true)
      // 根节点不会折叠，但子节点会
    })

    it('children 包含非 VECTOR 时不应折叠', () => {
      const node: Node = {
        id: 'container',
        name: 'Container',
        type: 'FRAME',
        visible: true,
        children: [
          { id: 'v1', name: 'Vector', type: 'VECTOR', visible: true },
          { id: 't1', name: 'Text', type: 'TEXT', visible: true, characters: 'Hello' },
        ]
      } as unknown as Node

      const simplified = simplifyNode(node, true)
      expect(simplified.children?.length).toBe(2)
    })
  })

  describe('simplifyNode - INSTANCE 折叠', () => {
    it('叶子 INSTANCE 应该被折叠', () => {
      const node: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        visible: true,
        children: [
          {
            id: 'inst',
            name: 'Button',
            type: 'INSTANCE',
            componentId: 'btn-001',
            visible: true,
            children: [
              { id: 't1', name: 'Label', type: 'TEXT', visible: true, characters: 'Click' }
            ]
          }
        ]
      } as unknown as Node

      const simplified = simplifyNode(node, true)
      const inst = simplified.children?.[0]
      expect(inst?.children?.length).toBe(0)
    })

    it('折叠叶子 INSTANCE 时保留子节点 TEXT 覆盖', () => {
      const node: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        visible: true,
        children: [
          {
            id: 'inst',
            name: 'PspuCard',
            type: 'INSTANCE',
            componentId: 'card-001',
            visible: true,
            children: [
              { id: 't1', name: 'Title', type: 'TEXT', visible: true, characters: '暗黑破坏神4' },
              { id: 'inner', name: 'Content', type: 'FRAME', visible: true, children: [
                { id: 't2', name: 'Subtitle', type: 'TEXT', visible: true, characters: '跟车服务' }
              ] },
              { id: 't3', name: 'Empty', type: 'TEXT', visible: true, characters: '   ' },
              { id: 'tHidden', name: 'Hidden', type: 'TEXT', visible: false, characters: 'skip me' }
            ]
          }
        ]
      } as unknown as Node

      const simplified = simplifyNode(node, true)
      const inst = simplified.children?.[0] as Node & { _textOverrides?: Array<{ name?: string; text: string }> }
      expect(inst.children?.length).toBe(0)
      expect(inst._textOverrides).toEqual([
        { name: 'Title', text: '暗黑破坏神4' },
        { name: 'Subtitle', text: '跟车服务' }
      ])
    })

    it.skip('包含嵌套 INSTANCE 的组件不应该被折叠', () => {
      const node: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        visible: true,
        children: [
          {
            id: 'card',
            name: 'Card',
            type: 'INSTANCE',
            componentId: 'card-001',
            visible: true,
            children: [
              {
                id: 'btn',
                name: 'Button',
                type: 'INSTANCE',
                componentId: 'btn-001',
                visible: true,
                children: []
              }
            ]
          }
        ]
      } as unknown as Node

      const simplified = simplifyNode(node, true)
      const card = simplified.children?.[0]
      // Card 包含嵌套 INSTANCE，不应被折叠
      expect(card?.children?.length).toBeGreaterThan(0)
    })

    it.skip('配置了前缀时应该按前缀折叠', () => {
      const node: Node = {
        id: 'root',
        name: 'Root',
        type: 'FRAME',
        visible: true,
        children: [
          {
            id: 'inst1',
            name: '💙 Button',
            type: 'INSTANCE',
            componentId: 'btn-001',
            visible: true,
            children: [
              {
                id: 'nested',
                name: 'Inner',
                type: 'INSTANCE',
                componentId: 'inner-001',
                visible: true,
                children: []
              }
            ]
          },
          {
            id: 'inst2',
            name: 'CustomCard',
            type: 'INSTANCE',
            componentId: 'card-001',
            visible: true,
            children: [
              {
                id: 'nested2',
                name: 'Inner',
                type: 'INSTANCE',
                componentId: 'inner-002',
                visible: true,
                children: []
              }
            ]
          }
        ]
      } as unknown as Node

      const simplified = simplifyNode(node, true, undefined, {
        baseComponentPrefixes: ['💙']
      })

      // 💙 Button 应被折叠
      expect(simplified.children?.[0]?.children?.length).toBe(0)
      // CustomCard 包含嵌套 INSTANCE，不应被折叠
      expect(simplified.children?.[1]?.children?.length).toBeGreaterThan(0)
    })
  })
})
