import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'

import { compareSemver, checkForUpdate } from '../src/version-check'

describe('compareSemver', () => {
  it('compares major.minor.patch numerically', () => {
    expect(compareSemver('0.5.0', '0.5.1')).toBeLessThan(0)
    expect(compareSemver('0.5.2', '0.5.1')).toBeGreaterThan(0)
    expect(compareSemver('1.0.0', '0.9.9')).toBeGreaterThan(0)
    expect(compareSemver('0.10.0', '0.9.999')).toBeGreaterThan(0)
  })

  it('treats equal versions as zero', () => {
    expect(compareSemver('0.5.1', '0.5.1')).toBe(0)
  })

  it('stable > prerelease for same core version', () => {
    expect(compareSemver('0.5.2', '0.5.2-beta.0')).toBeGreaterThan(0)
    expect(compareSemver('0.5.2-beta.0', '0.5.2')).toBeLessThan(0)
  })

  it('compares prerelease tags lexicographically', () => {
    expect(compareSemver('0.5.2-beta.0', '0.5.2-beta.1')).toBeLessThan(0)
  })

  it('handles missing patch gracefully', () => {
    expect(compareSemver('1.0', '1.0.0')).toBe(0)
    expect(compareSemver('1.0', '1.0.1')).toBeLessThan(0)
  })
})

// checkForUpdate 测试需要隔离用户 home 目录避免污染真实缓存；
// 用 HOME env 重定向 + 强制 force=false 走缓存路径，模拟 "registry 拿到更高版本" 场景
describe('checkForUpdate (cache branch)', () => {
  let originalHome: string | undefined
  let tmpHome: string

  beforeEach(() => {
    originalHome = process.env.HOME
    tmpHome = mkdtempSync(join(tmpdir(), 'figma-to-code-test-'))
    process.env.HOME = tmpHome
  })

  afterEach(() => {
    if (originalHome) process.env.HOME = originalHome
    else delete process.env.HOME
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('returns null when cache says current is latest', () => {
    const cacheDir = join(tmpHome, '.cache', 'figma-to-code')
    const cacheFile = join(cacheDir, 'version-check.json')
    mkdirp(cacheDir)
    writeFileSync(cacheFile, JSON.stringify({ latest: '0.5.1', checkedAt: Date.now() }))

    const result = checkForUpdate('0.5.1')
    expect(result).toBeNull()
  })

  it('returns update info when cached latest is higher', () => {
    const cacheDir = join(tmpHome, '.cache', 'figma-to-code')
    const cacheFile = join(cacheDir, 'version-check.json')
    mkdirp(cacheDir)
    writeFileSync(cacheFile, JSON.stringify({ latest: '0.9.0', checkedAt: Date.now() }))

    const result = checkForUpdate('0.5.1')
    expect(result).not.toBeNull()
    expect(result?.latest).toBe('0.9.0')
    expect(result?.current).toBe('0.5.1')
    expect(result?.installCmd).toContain('figma-to-code@0.9.0')
  })

  it('marks prerelease users as isPrerelease=true', () => {
    const cacheDir = join(tmpHome, '.cache', 'figma-to-code')
    const cacheFile = join(cacheDir, 'version-check.json')
    mkdirp(cacheDir)
    writeFileSync(cacheFile, JSON.stringify({ latest: '0.9.0', checkedAt: Date.now() }))

    const result = checkForUpdate('0.5.1-beta.0')
    expect(result?.isPrerelease).toBe(true)
  })
})

function mkdirp(dir: string) {
  const { mkdirSync } = require('node:fs') as typeof import('node:fs')
  mkdirSync(dir, { recursive: true })
}
