/**
 * 真实 Figma 链接集成测试
 * 运行前需配置 PAT：
 *   .env.local 写入 FIGMA_PAT=xxx
 *   或 macOS Keychain: security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "xxx"
 *
 * 用法：
 *   FIGMA_URL="https://www.figma.com/design/xxx/..." pnpm test:run tests/integration.test.ts
 */

import { describe, expect, it } from 'vitest'

import { convertFigmaToCode, FigmaAPIClient, readFigmaPAT } from '../src/index'

// 从环境变量或直接修改此处粘贴链接
// const FIGMA_URL = 'https://www.figma.com/design/Vzq8cBkRTFu8Oew9GMSMVx/46_%E5%95%86%E5%AE%B6%E5%8A%A9%E6%89%8B%E5%B7%A5%E4%BD%9C%E5%8F%B0-%F0%9F%A9%B5?node-id=8746-66493&m=dev' ?? ''
// const FIGMA_URL = 'https://www.figma.com/design/Vzq8cBkRTFu8Oew9GMSMVx/46_%E5%95%86%E5%AE%B6%E5%8A%A9%E6%89%8B%E5%B7%A5%E4%BD%9C%E5%8F%B0-%F0%9F%A9%B5?node-id=7626-96347&m=dev' ?? ''
const FIGMA_URL = 'https://www.figma.com/design/XP6Z8QP71DLOIe1xggGchR/40_%E4%BA%A4%E6%98%93%E5%90%8E-%E2%9D%A4%EF%B8%8F_%E8%AE%A2%E5%8D%95---%E5%94%AE%E5%90%8E%E5%8D%95---%E9%92%B1%E5%8C%85---%E5%BC%82%E5%B8%B8%E9%80%80%E5% 9B%9E%EF%BC%882025-08-~-%E8%87%B3%E4%BB%8A%EF%BC%89?node-id=3-15932&m=dev'
/**
 * 解析 Figma URL 中的 fileKey 和 nodeId
 * 支持格式：
 *   https://www.figma.com/design/<fileKey>/...?node-id=<nodeId>
 *   https://www.figma.com/file/<fileKey>/...?node-id=<nodeId>
 */
function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
  const match = url.match(/figma\.com\/(?:file|design)\/([^/?]+)/)
  if (!match) {
    throw new Error(`无法解析 Figma URL：${url}`)
  }

  const fileKey = match[1]
  const nodeIdParam = new URL(url).searchParams.get('node-id')
  // node-id 格式可能是 "1-2" 或 "1:2"，统一转为 "1:2"
  const nodeId = nodeIdParam ? nodeIdParam.replace(/-/, ':') : undefined

  return { fileKey, nodeId }
}

describe('Figma 真实链接集成测试', () => {3
  it('解析 Figma URL', () => {
    // 仅做格式验证，不需要真实链接
    const url = 'https://www.figma.com/design/abc123def456/MyDesign?node-id=1-2'
    const { fileKey, nodeId } = parseFigmaUrl(url)
    expect(fileKey).toBe('abc123def456')
    expect(nodeId).toBe('1:2')
  })

  it('读取 PAT', async () => {
    const pat = await readFigmaPAT()
    expect(typeof pat).toBe('string')
    expect(pat.length).toBeGreaterThan(0)
    console.log('PAT 读取成功，长度：', pat.length)
  })

  it('验证 PAT 有效性', async () => {
    const pat = await readFigmaPAT()
    const client = new FigmaAPIClient(pat)
    const isValid = await client.validateToken()
    console.log('PAT 是否有效：', isValid)
    expect(isValid).toBe(true)
  }, 30000)

  it.skipIf(!FIGMA_URL)('从真实链接转换为代码', async () => {
    const { fileKey, nodeId } = parseFigmaUrl(FIGMA_URL)
    console.log('\n======== Figma 链接信息 ========')
    console.log('fileKey:', fileKey)
    console.log('nodeId:', nodeId ?? '（未指定，使用第一个页面）')

    const result = await convertFigmaToCode({
      fileKey,
      nodeId,
      framework: 'vue',
      styleFormat: 'unocss'
    })

    console.log('\n======== 生成的 HTML ========')
    console.log(result.code)

    console.log('\n======== CSS 样式映射 ========')
    for (const [className, cssText] of Object.entries(result.styles)) {
      console.log(`.${className} {\n${cssText}\n}`)
    }

    console.log('\n======== 识别到的子组件 ========')
    if (result.instanceComponents.length > 0) {
      for (const inst of result.instanceComponents) {
        console.log(`  - ${inst.name}  figma-node: ${inst.componentId}`)
      }
    } else {
      console.log('（无子组件）')
    }

    // Vue SFC 结构验证
    expect(result.code).toContain('<script setup lang="ts">')
    expect(result.code).toContain('<template>')
    expect(result.code).toContain('</template>')

    // template 内有真实节点
    expect(result.code).toMatch(/<template>\s*<\w/)

    // script 在 template 之前
    const scriptIdx = result.code.indexOf('<script')
    const templateIdx = result.code.indexOf('<template>')
    expect(scriptIdx).toBeLessThan(templateIdx)

    expect(typeof result.styles).toBe('object')
    expect(Array.isArray(result.instanceComponents)).toBe(true)
  }, 60000)

  // it.skipIf(!FIGMA_URL)('获取文件原始数据', async () => {
  //   const { fileKey, nodeId } = parseFigmaUrl(FIGMA_URL)
  //   const pat = await readFigmaPAT()
  //   const client = new FigmaAPIClient(pat)

  //   const fileData = await client.getFile(fileKey, {
  //     ...(nodeId ? { ids: [nodeId] } : {}),
  //     depth: 2
  //   })

  //   console.log('\n======== 文件信息 ========')
  //   console.log('文件名：', fileData.name)
  //   console.log('最后修改：', fileData.lastModified)
  //   console.log('页面数量：', fileData.document.children?.length ?? 0)

  //   const pages = fileData.document.children ?? []
  //   for (const page of pages) {
  //     console.log(`  - 页面「${page.name}」，子节点数：${page.children?.length ?? 0}`)
  //   }

  //   expect(fileData.name).toBeTruthy()
  // }, 60000)
})
