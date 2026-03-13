import { describe, expect, it } from 'vitest'
import { convertCSSToUnoCSS } from '../src/converter/unocss/converter'
import {
  convertSpacing,
  convertGap,
  convertColor,
  convertTextColor,
  convertBorderRadius,
  convertFontSize,
  convertFontWeight
} from '../src/converter/unocss/mappings'

describe('UnoCSS Converter', () => {
  describe('convertCSSToUnoCSS', () => {
    it('should convert flex layout CSS to UnoCSS classes', () => {
      const css = {
        display: 'flex',
        'flex-direction': 'column',
        gap: '8px',
        'align-items': 'center',
        'justify-content': 'space-between'
      }

      const result = convertCSSToUnoCSS(css)

      expect(result.classes).toContain('flex')
      expect(result.classes).toContain('flex-col')
      expect(result.classes).toContain('items-center')
      expect(result.classes).toContain('justify-between')
    })

    it('should convert padding to UnoCSS classes', () => {
      const css = {
        padding: '16px'
      }

      const result = convertCSSToUnoCSS(css)

      expect(result.classes.length).toBeGreaterThan(0)
      expect(result.classes[0]).toMatch(/^p-/)
    })

    it('should convert background color to UnoCSS classes', () => {
      const css = {
        'background-color': 'rgb(255, 255, 255)'
      }

      const result = convertCSSToUnoCSS(css)

      expect(result.classes.length).toBeGreaterThan(0)
    })

    it('should keep unmappable CSS in remainingStyles', () => {
      const css = {
        display: 'flex',
        'custom-property': 'custom-value'
      }

      const result = convertCSSToUnoCSS(css)

      expect(result.classes).toContain('flex')
      expect(result.remainingStyles).toHaveProperty('custom-property')
      expect(result.remainingStyles['custom-property']).toBe('custom-value')
    })
  })

  describe('UnoCSS Mappings', () => {
    describe('convertSpacing', () => {
      it('should preserve raw px values', () => {
        expect(convertSpacing('16px')).toBe('p-[16px]')
        expect(convertSpacing('0px')).toBe('p-0')
        expect(convertSpacing('32px')).toBe('p-[32px]')
      })
    })

    describe('convertGap', () => {
      it('should preserve raw px values', () => {
        expect(convertGap('8px')).toBe('gap-[8px]')
        expect(convertGap('0px')).toBe('gap-0')
        expect(convertGap('32px')).toBe('gap-[32px]')
      })
    })

    describe('convertColor', () => {
      it('should convert RGB colors', () => {
        const result = convertColor('rgb(255, 255, 255)')
        expect(result).toBeTruthy()
      })

      it('should handle black and white', () => {
        expect(convertColor('rgb(0, 0, 0)')).toBe('bg-black')
        expect(convertColor('rgb(255, 255, 255)')).toBe('bg-white')
      })
    })

    describe('convertTextColor', () => {
      it('should convert text colors', () => {
        const result = convertTextColor('rgb(255, 0, 0)')
        expect(result).toMatch(/^text-/)
      })
    })

    describe('convertBorderRadius', () => {
      it('should preserve raw px values', () => {
        expect(convertBorderRadius('8px')).toBe('rounded-[8px]')
        expect(convertBorderRadius('4px')).toBe('rounded-[4px]')
        expect(convertBorderRadius('0px')).toBeNull()
      })
    })

    describe('convertFontSize', () => {
      it('should preserve raw px values', () => {
        expect(convertFontSize('16px')).toBe('text-[16px]')
        expect(convertFontSize('14px')).toBe('text-[14px]')
        expect(convertFontSize('12px')).toBe('text-[12px]')
      })
    })

    describe('convertFontWeight', () => {
      it('should convert font weights to arbitrary values', () => {
        expect(convertFontWeight('400')).toBe('font-[400]')
        expect(convertFontWeight('700')).toBe('font-[700]')
        expect(convertFontWeight('500')).toBe('font-[500]')
      })
    })
  })
})
