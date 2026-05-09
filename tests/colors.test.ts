import { describe, expect, it } from 'vitest'
import { convertPaintToColor, type VariableMap } from '../src/converter/colors'
import type { Paint } from '../src/api/types'

const solidPaint: Paint = {
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0, a: 1 },
  visible: true
}

const solidPaintWithOpacity: Paint = {
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0, a: 0.64 },
  visible: true
}

const boundPaint: Paint = {
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0, a: 1 },
  visible: true,
  boundVariables: {
    color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' }
  }
}

const boundPaintWithOpacity: Paint = {
  type: 'SOLID',
  color: { r: 0, g: 0, b: 0, a: 0.64 },
  visible: true,
  boundVariables: {
    color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:2' }
  }
}

describe('convertPaintToColor', () => {
  describe('无 variableMap', () => {
    it('不透明颜色输出 hex', () => {
      expect(convertPaintToColor(solidPaint)).toBe('#000000')
    })

    it('半透明颜色输出 rgba', () => {
      expect(convertPaintToColor(solidPaintWithOpacity)).toBe('rgba(0, 0, 0, 0.64)')
    })

    it('有 boundVariables 但无 variableMap，降级输出原始值', () => {
      expect(convertPaintToColor(boundPaint)).toBe('#000000')
    })
  })

  describe('有 variableMap', () => {
    const variableMap: VariableMap = new Map([
      ['VariableID:1:1', '--text-1'],
      ['VariableID:1:2', '--text-secondary'],
    ])

    it('有绑定 Variable，输出 var(--name, fallback)', () => {
      expect(convertPaintToColor(boundPaint, variableMap)).toBe('var(--text-1,#000000)')
    })

    it('半透明颜色的 fallback 是 rgba', () => {
      expect(convertPaintToColor(boundPaintWithOpacity, variableMap)).toBe('var(--text-secondary,rgba(0, 0, 0, 0.64))')
    })

    it('无 boundVariables，正常输出原始值', () => {
      expect(convertPaintToColor(solidPaint, variableMap)).toBe('#000000')
    })

    it('Variable ID 不在 map 中，降级输出原始值', () => {
      const unknownBoundPaint: Paint = {
        ...boundPaint,
        boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:9:9' } }
      }
      expect(convertPaintToColor(unknownBoundPaint, variableMap)).toBe('#000000')
    })
  })

  describe('hex 反向匹配 (A3)', () => {
    // 同一 Map 同时承载 forward 和 reverse 条目;cli.ts 加载 JSON 时会自动塞 "#hex" 键
    const reversibleMap: VariableMap = new Map([
      ['VariableID:1:1', '--bg-1'],
      ['#f7f7f9', '--bg-1'],
      ['#000000', '--text-1'],
    ])

    it('未绑变量但 hex 命中,输出 var(--name, hex)', () => {
      const f7Paint: Paint = {
        type: 'SOLID',
        color: { r: 247 / 255, g: 247 / 255, b: 249 / 255, a: 1 },
        visible: true
      }
      expect(convertPaintToColor(f7Paint, reversibleMap)).toBe('var(--bg-1,#f7f7f9)')
    })

    it('boundVariables 优先于 hex 反查', () => {
      // 节点既绑了 ID(命中 --bg-1)又是 #000000(也命中 --text-1) → 走 ID
      const blackBoundToBg: Paint = {
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0, a: 1 },
        visible: true,
        boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' } }
      }
      expect(convertPaintToColor(blackBoundToBg, reversibleMap)).toBe('var(--bg-1,#000000)')
    })

    it('半透明色不参与反查(只反查不透明色)', () => {
      // 即使 RGB 部分对应 #000000,带 alpha 也直接输出 rgba 而不反查
      expect(convertPaintToColor(solidPaintWithOpacity, reversibleMap)).toBe('rgba(0, 0, 0, 0.64)')
    })

    it('hex 不命中时降级原始值', () => {
      const ff5500Paint: Paint = {
        type: 'SOLID',
        color: { r: 1, g: 0x55 / 255, b: 0, a: 1 },
        visible: true
      }
      expect(convertPaintToColor(ff5500Paint, reversibleMap)).toBe('#ff5500')
    })
  })
})
