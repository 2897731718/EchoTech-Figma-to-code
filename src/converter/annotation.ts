const ANNOTATION_CONFIG_URL = 'https://config-cdn.product-aapp.com/dumpling_plugin/annotation_config.json'

interface AnnotationPlatform {
  className: string
  codeStandard?: string
  developer?: string
  docLink?: string
}

interface AnnotationEntry {
  componentKey: string
  nodeId: string
  nodeName: string
  annotation: {
    nodeId: string
    platforms: {
      flutter?: AnnotationPlatform
    }
  }
}

interface AnnotationConfig {
  annotations: AnnotationEntry[]
  version: string
}

/**
 * 从远程 CDN 拉取 annotation_config，构建 componentKey → className 映射。
 * 失败时静默降级返回空映射。
 */
export async function loadAnnotationMap(
  platform: 'flutter'
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  try {
    const response = await fetch(ANNOTATION_CONFIG_URL)
    if (!response.ok) {
      console.error(`[figma-to-code] annotation_config 获取失败: ${response.status}`)
      return map
    }

    const config: AnnotationConfig = await response.json()

    for (const entry of config.annotations) {
      const platformConfig = entry.annotation.platforms[platform]
      if (platformConfig?.className) {
        map.set(entry.componentKey, platformConfig.className)
      }
    }

    console.error(`[figma-to-code] 组件映射: ${map.size} 个 (${platform})`)
  } catch (e) {
    console.error(`[figma-to-code] annotation_config 加载失败，组件名将使用 Figma 节点名降级`)
  }

  return map
}

/**
 * 从 FileResponse.components 构建 componentId → className 映射。
 *
 * 匹配策略：
 * 1. 用 Component 自身的 key 匹配 annotationMap
 * 2. 如果是变体（有 componentSetId），用 ComponentSet 的 key 匹配
 *    （annotation_config 标注时取的是 ComponentSet 的 key）
 */
export function buildComponentClassNameMap(
  fileComponents: Record<string, { key: string; name: string; componentSetId?: string }>,
  annotationMap: Map<string, string>,
  fileComponentSets?: Record<string, { key: string; name: string }>
): Map<string, string> {
  const map = new Map<string, string>()

  for (const [componentId, component] of Object.entries(fileComponents)) {
    // 1. 先用 Component 自身的 key 匹配
    let className = annotationMap.get(component.key)

    // 2. 如果没匹配到且是变体，用 ComponentSet 的 key 匹配
    if (!className && component.componentSetId && fileComponentSets) {
      const componentSet = fileComponentSets[component.componentSetId]
      if (componentSet) {
        className = annotationMap.get(componentSet.key)
      }
    }

    if (className) {
      map.set(componentId, className)
    }
  }

  return map
}
