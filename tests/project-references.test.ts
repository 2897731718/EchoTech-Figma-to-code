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

  it('does not pick up files from .claude/ directory', () => {
    // Flutter 项目约定只看根目录 CLAUDE.md / AGENTS.md，不扫 .claude/
    const claudeDir = join(tmpRoot, '.claude')
    mkdirSync(claudeDir, { recursive: true })
    writeFileSync(join(claudeDir, 'figma-context.md'), '#')
    writeFileSync(join(claudeDir, 'figma-context-custom-flutter.md'), '#')
    const result = findProjectReferenceFiles(tmpRoot)
    expect(result).toEqual([])
  })

  it('returns relative paths (never absolute)', () => {
    writeFileSync(join(tmpRoot, 'CLAUDE.md'), '#')
    const result = findProjectReferenceFiles(tmpRoot)
    for (const r of result) {
      expect(r.startsWith('/')).toBe(false)
    }
  })
})
