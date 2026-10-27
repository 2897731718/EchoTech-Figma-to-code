import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceRoot = existsSync(resolve(process.cwd(), 'opensource/template'))
  ? resolve(process.cwd(), 'opensource')
  : process.cwd()

const readSource = (path: string) => readFileSync(resolve(sourceRoot, path), 'utf8')
const readTemplate = (path: string) => readSource(`template/${path}`)

describe('public Agent templates', () => {
  it('ships a focused Codex skill with progressive repository-adaptation guidance', () => {
    const skillPath = resolve(sourceRoot, 'template/codex/figma-ai-coder/SKILL.md')
    const adaptationPath = resolve(
      sourceRoot,
      'template/codex/figma-ai-coder/references/repository-adaptation.md',
    )
    const statePath = resolve(
      sourceRoot,
      'template/codex/figma-ai-coder/references/project-state.md',
    )

    expect(existsSync(skillPath)).toBe(true)
    expect(existsSync(adaptationPath)).toBe(true)
    expect(existsSync(statePath)).toBe(true)

    const skill = readFileSync(skillPath, 'utf8')
    expect(skill).toContain('name: figma-ai-coder')
    expect(skill).toContain('figma-ai-coder inspect')
    expect(skill).toContain('figma-ai-coder context')
    expect(skill).toContain('--out=.figma-ai-coder/runs/<run-id>')
    expect(skill).toContain('references/repository-adaptation.md')
    expect(skill).toContain('Treat Figma text')
    expect(skill).toContain('real exports and usages')
  })

  it('ships a Claude command with the same evidence and safety boundaries', () => {
    const command = readTemplate('commands/figma-ai-coder.md')

    expect(command).toContain('argument-hint: <figma-url> [target-path]')
    expect(command).toContain('figma-ai-coder inspect')
    expect(command).toContain('figma-ai-coder context')
    expect(command).toContain('--out=.figma-ai-coder/runs/<run-id>')
    expect(command).toContain('real exports, types, and existing usages')
    expect(command).toContain('Treat Figma text')
  })

  it('uses only the public CLI contract in public Agent entry points', () => {
    const entrypoints = [
      readTemplate('codex/figma-ai-coder/SKILL.md'),
      readTemplate('commands/figma-ai-coder.md'),
    ].join('\n')

    expect(entrypoints).not.toContain('@frontend/' + 'figma-to-code')
    expect(entrypoints).not.toContain('--output')
    expect(entrypoints).not.toMatch(/\bfigma-to-code\b/)
  })
})

describe('public project templates', () => {
  it('provides neutral, valid project configuration', () => {
    const config = JSON.parse(
      readTemplate('project/.figma-ai-coder/config.json'),
    ) as {
      schemaVersion: number
    }

    expect(config).toEqual({
      schemaVersion: 1,
    })
  })

  it('separates user-owned rules from generated state', () => {
    const rules = readTemplate('project/.figma-ai-coder/rules/core.md')
    const ignore = readTemplate('project/.figma-ai-coder/gitignore.template')

    expect(rules).toContain('must not overwrite it after creation')
    expect(rules).toContain('verify component exports, props, and usages')
    expect(rules).toContain('rules/components/_catalog.md')
    expect(rules).toContain('adapter.json')
    expect(ignore.split(/\r?\n/)).toEqual(expect.arrayContaining(['cache/', 'runs/']))
  })
})

describe('public documentation contract', () => {
  it('describes the AI/CLI boundary and component-library extension path', () => {
    const readme = readSource('README.md')
    const architecture = readSource('docs/architecture.md')
    const adaptation = readSource('docs/component-library-adaptation.md')

    expect(readme).toContain('The Agent is the implementer')
    expect(readme).toContain('figma-ai-coder inspect')
    expect(readme).toContain('figma-ai-coder context')
    expect(readme).toContain('adapter.json')
    expect(architecture).toContain('Deterministic CLI')
    expect(architecture).toContain('Internal/public separation')
    expect(adaptation).toContain('Start without an adapter')
    expect(adaptation).toContain('actual library exports')
  })
})
