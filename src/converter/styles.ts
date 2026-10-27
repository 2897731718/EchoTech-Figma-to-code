import type { Paint } from '../api/types'

import { convertPaintToColor, type VariableMap } from './colors'

export function convertFillsToBackgroundColor(fills: Paint[] | undefined, variableMap?: VariableMap): string | null {
  if (!fills || fills.length === 0) {
    return null
  }

  const visibleFills = fills.filter((fill) => fill.visible !== false)
  if (visibleFills.length === 0) {
    return null
  }

  const solidFill = visibleFills.find((fill) => fill.type === 'SOLID')
  if (solidFill) {
    return convertPaintToColor(solidFill, variableMap)
  }

  const gradientFill = visibleFills.find(
    (fill) =>
      fill.type === 'GRADIENT_LINEAR' ||
      fill.type === 'GRADIENT_RADIAL' ||
      fill.type === 'GRADIENT_ANGULAR' ||
      fill.type === 'GRADIENT_DIAMOND'
  )
  if (gradientFill) {
    return convertPaintToColor(gradientFill, variableMap)
  }

  const imageFill = visibleFills.find((fill) => fill.type === 'IMAGE')
  if (imageFill) {
    return `url(figma-image:${imageFill.imageHash ?? 'unknown'})`
  }

  return null
}

export function convertStrokesToBorder(
  strokes: Paint[] | undefined,
  strokeWeight: number | undefined,
  variableMap?: VariableMap
): Record<string, string> {
  const result: Record<string, string> = {}

  if (!strokes || strokes.length === 0 || !strokeWeight || strokeWeight === 0) {
    return result
  }

  const visibleStrokes = strokes.filter((stroke) => stroke.visible !== false)
  if (visibleStrokes.length === 0) {
    return result
  }

  const strokeColor = convertPaintToColor(visibleStrokes[0], variableMap)
  if (strokeColor) {
    result['border-width'] = `${strokeWeight}px`
    result['border-style'] = 'solid'
    result['border-color'] = strokeColor
  }

  return result
}

export function convertCornerRadius(radius: number | undefined): string | null {
  if (radius === undefined || radius === 0) {
    return null
  }
  return `${radius}px`
}

export function convertRectangleCornerRadii(
  radii: [number, number, number, number] | undefined
): Record<string, string> | null {
  if (!radii) {
    return null
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = radii

  if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
    if (topLeft === 0) {
      return null
    }
    return { 'border-radius': `${topLeft}px` }
  }

  return {
    'border-radius': `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`
  }
}
