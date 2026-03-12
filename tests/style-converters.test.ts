import { describe, expect, it } from 'vitest'
import { CSSConverter } from '../src/converter/styles/css-converter'
import { UnoCSSConverter } from '../src/converter/styles/unocss-converter'
import { InlineConverter } from '../src/converter/styles/inline-converter'
import { createStyleConverter } from '../src/converter/styles/converter-factory'

describe('Style Converters', () => {
  const mockCSS = {
    display: 'flex',
    'flex-direction': 'column',
    padding: '16px',
    'background-color': 'rgb(255, 255, 255)'
  }

  const mockNodeId = '123:456'

  describe('CSSConverter', () => {
    it('should generate className for CSS format', () => {
      const converter = new CSSConverter()
      const result = converter.convert(mockCSS, mockNodeId)

      expect(result.className).toBe('node-123-456')
      expect(result.style).toBeUndefined()
      expect(result.classes).toBeUndefined()
    })

    it('should return empty object for empty CSS', () => {
      const converter = new CSSConverter()
      const result = converter.convert({}, mockNodeId)

      expect(result).toEqual({})
    })
  })

  describe('UnoCSSConverter', () => {
    it('should convert CSS to UnoCSS classes', () => {
      const converter = new UnoCSSConverter()
      const result = converter.convert(mockCSS, mockNodeId)

      expect(result.classes).toBeDefined()
      expect(Array.isArray(result.classes)).toBe(true)
      expect(result.classes!.length).toBeGreaterThan(0)
    })

    it('should include remaining styles if not all can be converted', () => {
      const cssWithCustom = {
        ...mockCSS,
        'custom-property': 'custom-value'
      }

      const converter = new UnoCSSConverter()
      const result = converter.convert(cssWithCustom, mockNodeId)

      expect(result.classes).toBeDefined()
      expect(result.style).toBeDefined()
      expect(result.style!['custom-property']).toBe('custom-value')
    })
  })

  describe('InlineConverter', () => {
    it('should convert CSS to inline style object', () => {
      const converter = new InlineConverter()
      const result = converter.convert(mockCSS, mockNodeId)

      expect(result.style).toEqual(mockCSS)
      expect(result.className).toBeUndefined()
      expect(result.classes).toBeUndefined()
    })

    it('should return empty object for empty CSS', () => {
      const converter = new InlineConverter()
      const result = converter.convert({}, mockNodeId)

      expect(result).toEqual({})
    })
  })

  describe('createStyleConverter', () => {
    it('should create CSS converter for css format', () => {
      const converter = createStyleConverter('css')
      expect(converter).toBeInstanceOf(CSSConverter)
    })

    it('should create UnoCSS converter for unocss format', () => {
      const converter = createStyleConverter('unocss')
      expect(converter).toBeInstanceOf(UnoCSSConverter)
    })

    it('should create Inline converter for inline format', () => {
      const converter = createStyleConverter('inline')
      expect(converter).toBeInstanceOf(InlineConverter)
    })

    it('should default to CSS converter for unknown format', () => {
      const converter = createStyleConverter('unknown' as any)
      expect(converter).toBeInstanceOf(CSSConverter)
    })
  })
})
