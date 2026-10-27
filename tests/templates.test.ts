import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readTemplate = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('public templates', () => {
  it('ships a Codex skill for the public package', () => {
    const skill = readTemplate('template/codex/figma-to-code/SKILL.md')
    expect(skill).toContain('name: figma-to-code')
    expect(skill).toContain('figma-to-code "<figma-url>"')
    expect(skill).toContain('Vue、React 或 HTML')
  })

  it('ships a Claude command for web frameworks', () => {
    const command = readTemplate('template/commands/figma.md')
    expect(command).toContain('vue|react|html')
  })
})
