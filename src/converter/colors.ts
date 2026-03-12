import type { Paint, RGB } from '../api/types'

export function rgbToHex(r: number, g: number, b: number, opacity?: number): string {
  const r255 = Math.round(Math.max(0, Math.min(1, r)) * 255)
  const g255 = Math.round(Math.max(0, Math.min(1, g)) * 255)
  const b255 = Math.round(Math.max(0, Math.min(1, b)) * 255)

  const hex = `#${r255.toString(16).padStart(2, '0')}${g255.toString(16).padStart(2, '0')}${b255.toString(16).padStart(2, '0')}`

  if (opacity !== undefined && opacity < 1) {
    const a255 = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    return `${hex}${a255.toString(16).padStart(2, '0')}`
  }

  return hex
}

export function rgbToRgba(r: number, g: number, b: number, opacity?: number): string {
  const r255 = Math.round(Math.max(0, Math.min(1, r)) * 255)
  const g255 = Math.round(Math.max(0, Math.min(1, g)) * 255)
  const b255 = Math.round(Math.max(0, Math.min(1, b)) * 255)
  const a = opacity !== undefined ? Math.round(Math.max(0, Math.min(1, opacity)) * 100) / 100 : 1

  return `rgba(${r255}, ${g255}, ${b255}, ${a})`
}

export function convertPaintToColor(paint: Paint): string | null {
  if (paint.visible === false) {
    return null
  }

  if (paint.type === 'SOLID' && paint.color) {
    const { r, g, b } = paint.color
    const opacity = paint.opacity ?? paint.color.a ?? 1

    if (opacity === 1) {
      return rgbToHex(r, g, b)
    }
    return rgbToRgba(r, g, b, opacity)
  }

  if (paint.type === 'GRADIENT_LINEAR' && paint.gradientStops) {
    const stops = paint.gradientStops
      .map((stop) => {
        const color = convertRGBToColor(stop.color)
        const position = Math.round(stop.position * 100)
        return `${color} ${position}%`
      })
      .join(', ')

    return `linear-gradient(${stops})`
  }

  if (paint.type === 'GRADIENT_RADIAL' && paint.gradientStops) {
    const stops = paint.gradientStops
      .map((stop) => {
        const color = convertRGBToColor(stop.color)
        const position = Math.round(stop.position * 100)
        return `${color} ${position}%`
      })
      .join(', ')

    return `radial-gradient(${stops})`
  }

  return null
}

function convertRGBToColor(rgb: RGB): string {
  const opacity = rgb.a ?? 1
  if (opacity === 1) {
    return rgbToHex(rgb.r, rgb.g, rgb.b)
  }
  return rgbToRgba(rgb.r, rgb.g, rgb.b, opacity)
}
