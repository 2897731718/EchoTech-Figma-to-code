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
})
