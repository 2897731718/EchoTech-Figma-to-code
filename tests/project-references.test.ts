import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { findProjectReferenceFiles } from '../src/project-references'

describe('findProjectReferenceFiles', () => {
  let tmpRoot: string

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'project-ref-'))
  })

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('returns empty when nothing matches', () => {
    expect(findProjectReferenceFiles(tmpRoot)).toEqual([])
  })

  it('picks up CLAUDE.md and AGENTS.md from root', () => {
    writeFileSync(join(tmpRoot, 'CLAUDE.md'), '#')
    writeFileSync(join(tmpRoot, 'AGENTS.md'), '#')
    writeFileSync(join(tmpRoot, 'README.md'), '#') // should NOT be picked
    const result = findProjectReferenceFiles(tmpRoot)
    expect(result).toContain('CLAUDE.md')
    expect(result).toContain('AGENTS.md')
    expect(result).not.toContain('README.md')
  })

  it('collects all .claude/figma-context*.md variants sorted', () => {
    const claudeDir = join(tmpRoot, '.claude')
    mkdirSync(claudeDir, { recursive: true })
    writeFileSync(join(claudeDir, 'figma-context.md'), '#')
    writeFileSync(join(claudeDir, 'figma-context-custom-flutter.md'), '#')
    writeFileSync(join(claudeDir, 'figma-context-your-ui-lib.md'), '#')
    writeFileSync(join(claudeDir, 'other.md'), '#') // should NOT be picked

    const result = findProjectReferenceFiles(tmpRoot)
    expect(result).toContain('.claude/figma-context.md')
    expect(result).toContain('.claude/figma-context-your-ui-lib.md')
    expect(result).toContain('.claude/figma-context-custom-flutter.md')
    expect(result).not.toContain('.claude/other.md')
  })

  it('returns relative paths (never absolute)', () => {
    writeFileSync(join(tmpRoot, 'CLAUDE.md'), '#')
    const result = findProjectReferenceFiles(tmpRoot)
    for (const r of result) {
      expect(r.startsWith('/')).toBe(false)
    }
  })
})
