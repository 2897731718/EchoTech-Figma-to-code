import { describe, expect, it } from 'vitest'
import { convertFigmaToCode } from '../src/index'

const FIGMA_URL = process.env.FIGMA_URL ?? ''
const hasIntegrationConfig = Boolean(process.env.FIGMA_PAT && FIGMA_URL)

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
  const parsed = new URL(url)
  const match = parsed.pathname.match(/^\/(?:file|design)\/([^/]+)/)
  if (!match) throw new Error('FIGMA_URL is not a supported Figma file or design URL')
  const nodeId = parsed.searchParams.get('node-id')?.replace(/-/, ':')
  return { fileKey: match[1], nodeId }
}

describe.skipIf(!hasIntegrationConfig)('Figma integration', () => {
  it('converts an explicitly configured Figma node', async () => {
    const { fileKey, nodeId } = parseFigmaUrl(FIGMA_URL)
    const result = await convertFigmaToCode({
      fileKey,
      nodeId,
      framework: 'vue',
      styleFormat: 'css',
    })

    expect(result.code).toBeTruthy()
    expect(result.instanceComponents).toBeInstanceOf(Array)
  }, 30_000)
})
