import { describe, expect, it } from 'vitest'

import { rgbToHex, rgbToRgba, convertPaintToColor } from '../src/converter/colors'
import {
  convertFillsToBackgroundColor,
  convertStrokesToBorder,
  convertCornerRadius
} from '../src/converter/styles'
import { convertAutoLayout, type FrameNode } from '../src/converter/layout'
import { convertNodeToCSS } from '../src/converter/index'
import type { Paint } from '../src/api/types'

describe('Color Converter', () => {
  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(1, 0, 0)).toBe('#ff0000')
      expect(rgbToHex(0, 1, 0)).toBe('#00ff00')
      expect(rgbToHex(0, 0, 1)).toBe('#0000ff')
      expect(rgbToHex(0.5, 0.5, 0.5)).toBe('#808080')
    })

    it('should include alpha channel when opacity < 1', () => {
      expect(rgbToHex(1, 0, 0, 0.5)).toBe('#ff000080')
      expect(rgbToHex(0, 0, 0, 0)).toBe('#00000000')
    })
  })

  describe('rgbToRgba', () => {
    it('should convert RGB to rgba string', () => {
      expect(rgbToRgba(1, 0, 0)).toBe('rgba(255, 0, 0, 1)')
      expect(rgbToRgba(0, 1, 0, 0.5)).toBe('rgba(0, 255, 0, 0.5)')
    })
  })

  describe('convertPaintToColor', () => {
    it('should convert SOLID paint to color', () => {
      const paint: Paint = {
        type: 'SOLID',
        color: { r: 1, g: 0, b: 0 },
        opacity: 1
      }

      const result = convertPaintToColor(paint)
      expect(result).toBe('#ff0000')
    })

    it('should return null for invisible paint', () => {
      const paint: Paint = {
        type: 'SOLID',
        color: { r: 1, g: 0, b: 0 },
        visible: false
      }

      const result = convertPaintToColor(paint)
      expect(result).toBeNull()
    })

    it('should convert gradient paint', () => {
      const paint: Paint = {
        type: 'GRADIENT_LINEAR',
        gradientStops: [
          { position: 0, color: { r: 1, g: 0, b: 0 } },
          { position: 1, color: { r: 0, g: 0, b: 1 } }
        ]
      }

      const result = convertPaintToColor(paint)
      expect(result).toContain('linear-gradient')
      expect(result).toContain('#ff0000')
      expect(result).toContain('#0000ff')
    })
  })
})

describe('Style Converter', () => {
  describe('convertFillsToBackgroundColor', () => {
    it('should convert solid fill to background color', () => {
      const fills: Paint[] = [
        {
          type: 'SOLID',
          color: { r: 0, g: 0.478, b: 1 },
          opacity: 1
        }
      ]

      const result = convertFillsToBackgroundColor(fills)
      expect(result).toBe('#007aff')
    })

    it('should return null for empty fills', () => {
      expect(convertFillsToBackgroundColor(undefined)).toBeNull()
      expect(convertFillsToBackgroundColor([])).toBeNull()
    })

    it('should skip invisible fills', () => {
      const fills: Paint[] = [
        {
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0 },
          visible: false
        }
      ]

      const result = convertFillsToBackgroundColor(fills)
      expect(result).toBeNull()
    })
  })

  describe('convertStrokesToBorder', () => {
    it('should convert strokes to border styles', () => {
      const strokes: Paint[] = [
        {
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 },
          opacity: 1
        }
      ]

      const result = convertStrokesToBorder(strokes, 2)
      expect(result).toEqual({
        'border-width': '2px',
        'border-style': 'solid',
        'border-color': '#000000'
      })
    })

    it('should return empty object for zero stroke weight', () => {
      const strokes: Paint[] = [
        {
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0 }
        }
      ]

      const result = convertStrokesToBorder(strokes, 0)
      expect(result).toEqual({})
    })
  })

  describe('convertCornerRadius', () => {
    it('should convert radius to CSS', () => {
      expect(convertCornerRadius(8)).toBe('8px')
      expect(convertCornerRadius(16)).toBe('16px')
    })

    it('should return null for zero radius', () => {
      expect(convertCornerRadius(0)).toBeNull()
      expect(convertCornerRadius(undefined)).toBeNull()
    })
  })
})

describe('Layout Converter', () => {
  describe('convertAutoLayout', () => {
    it('should convert HORIZONTAL layout to flex row', () => {
      const node: FrameNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        itemSpacing: 16,
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER',
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 8
      }

      const result = convertAutoLayout(node)
      expect(result.display).toBe('flex')
      expect(result['flex-direction']).toBe('row')
      expect(result.gap).toBe('16px')
      expect(result['justify-content']).toBe('center')
      expect(result['align-items']).toBe('center')
      expect(result.padding).toBe('8px')
    })

    it('should convert VERTICAL layout to flex column', () => {
      const node: FrameNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        layoutMode: 'VERTICAL'
      }

      const result = convertAutoLayout(node)
      expect(result['flex-direction']).toBe('column')
    })

    it('should return empty object for NONE layout', () => {
      const node: FrameNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        layoutMode: 'NONE'
      }

      const result = convertAutoLayout(node)
      expect(result).toEqual({})
    })
  })

  describe('Variable bindings in convertNodeToCSS', () => {
    it('should apply variable to gap', () => {
      const variableMap = new Map([['VariableID:spacing:1', '--spacing-md']])
      const node = {
        id: '1:1', name: 'Frame', type: 'FRAME',
        layoutMode: 'HORIZONTAL', itemSpacing: 16,
        primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'MIN',
        boundVariables: { itemSpacing: { type: 'VARIABLE_ALIAS', id: 'VariableID:spacing:1' } },
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50 }
      } as any
      const css = convertNodeToCSS(node, undefined, new Map(), variableMap)
      expect(css.gap).toBe('var(--spacing-md,16px)')
    })

    it('should apply variable to border-radius', () => {
      const variableMap = new Map([['VariableID:radius:1', '--radius-sm']])
      const node = {
        id: '1:2', name: 'Rect', type: 'RECTANGLE',
        cornerRadius: 8,
        boundVariables: { cornerRadius: { type: 'VARIABLE_ALIAS', id: 'VariableID:radius:1' } },
        absoluteBoundingBox: { x: 0, y: 0, width: 80, height: 80 }
      } as any
      const css = convertNodeToCSS(node, undefined, new Map(), variableMap)
      expect(css['border-radius']).toBe('var(--radius-sm,8px)')
    })
  })
})

describe('IMAGE fill placeholder', () => {
  it('should return placeholder for IMAGE fill', () => {
    const fills: Paint[] = [{ type: 'IMAGE', imageHash: 'abc123def456' }]
    const result = convertFillsToBackgroundColor(fills)
    expect(result).toBe('url(figma-image:abc123def456)')
  })

  it('should return placeholder without hash when imageHash is missing', () => {
    const fills: Paint[] = [{ type: 'IMAGE' }]
    const result = convertFillsToBackgroundColor(fills)
    expect(result).toBe('url(figma-image:unknown)')
  })

  it('should prefer SOLID fill over IMAGE fill', () => {
    const fills: Paint[] = [
      { type: 'SOLID', color: { r: 1, g: 0, b: 0 } },
      { type: 'IMAGE', imageHash: 'abc123' }
    ]
    const result = convertFillsToBackgroundColor(fills)
    expect(result).toBe('#ff0000')
  })
})
