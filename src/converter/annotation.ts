export interface AnnotationPlatform {
  className: string
  codeStandard?: string
  developer?: string
  docLink?: string
}

interface AnnotationEntry {
  componentKey: string
  annotation: {
    platforms: Record<string, AnnotationPlatform | undefined>
  }
}

interface AnnotationConfig {
  annotations: AnnotationEntry[]
}

/**
 * Load an optional component annotation map. No network request is made unless
 * the caller passes a URL or sets FIGMA_TO_CODE_ANNOTATION_CONFIG_URL.
 */
export async function loadAnnotationMap(
  platform: string,
  url = process.env.FIGMA_TO_CODE_ANNOTATION_CONFIG_URL,
): Promise<Map<string, AnnotationPlatform>> {
  const map = new Map<string, AnnotationPlatform>()
  if (!url) return map

  try {
    const response = await fetch(url)
    if (!response.ok) return map
    const config = await response.json() as AnnotationConfig
    for (const entry of config.annotations) {
      const platformConfig = entry.annotation.platforms[platform]
      if (platformConfig?.className) map.set(entry.componentKey, platformConfig)
    }
  } catch {
    // Optional configuration failures must not block code generation.
  }
  return map
}

export function buildComponentClassNameMap(
  fileComponents: Record<string, { key: string; name: string; componentSetId?: string }>,
  annotationMap: Map<string, AnnotationPlatform>,
  fileComponentSets?: Record<string, { key: string; name: string }>,
): Map<string, AnnotationPlatform> {
  const map = new Map<string, AnnotationPlatform>()
  for (const [componentId, component] of Object.entries(fileComponents)) {
    let annotation = annotationMap.get(component.key)
    if (!annotation && component.componentSetId && fileComponentSets) {
      const componentSet = fileComponentSets[component.componentSetId]
      if (componentSet) annotation = annotationMap.get(componentSet.key)
    }
    if (annotation) map.set(componentId, annotation)
  }
  return map
}
