import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

import { readFigmaPAT, readPATFromEnv, readPATFromKeychain } from '../src/pat/reader'

vi.mock('node:child_process')
vi.mock('node:fs')
vi.mock('node:process', async () => {
  const actual = await vi.importActual('node:process')
  return {
    ...actual,
    cwd: vi.fn(() => '/test/project')
  }
})

describe('PAT Reader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.FIGMA_PAT
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('readPATFromEnv', () => {
    it('should read from process.env.FIGMA_PAT', () => {
      process.env.FIGMA_PAT = 'test-token-from-env'
      const result = readPATFromEnv()
      expect(result).toBe('test-token-from-env')
    })

    it('should read from .env.local file', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('FIGMA_PAT=test-token-from-file\n')

      const result = readPATFromEnv()
      expect(result).toBe('test-token-from-file')
    })

    it('should handle quoted values in .env.local', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('FIGMA_PAT="test-token-quoted"\n')

      const result = readPATFromEnv()
      expect(result).toBe('test-token-quoted')
    })

    it('should return null when no PAT found', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      const result = readPATFromEnv()
      expect(result).toBeNull()
    })

    it('should skip comments in .env.local', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('# FIGMA_PAT=ignored\nFIGMA_PAT=actual-token\n')

      const result = readPATFromEnv()
      expect(result).toBe('actual-token')
    })
  })

  describe('readPATFromKeychain', () => {
    it('should return null on non-macOS platforms', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      })

      const result = readPATFromKeychain()
      expect(result).toBeNull()

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true
      })
    })

    it('should read from keychain on macOS', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      })

      process.env.USER = 'testuser'
      vi.mocked(execSync).mockReturnValue('test-token-from-keychain' as any)

      const result = readPATFromKeychain()
      expect(result).toBe('test-token-from-keychain')

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true
      })
    })

    it('should try FIGMA_PAT_GLOBAL first, then FIGMA_PAT', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      })

      process.env.USER = 'testuser'
      vi.mocked(execSync)
        .mockImplementationOnce(() => {
          throw new Error('Not found')
        })
        .mockReturnValueOnce('token-from-figma-pat' as any)

      const result = readPATFromKeychain()
      expect(result).toBe('token-from-figma-pat')
      expect(execSync).toHaveBeenCalledTimes(2)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true
      })
    })
  })

  describe('readFigmaPAT', () => {
    it('should return PAT from .env.local first', async () => {
      // .env.local 优先级最高
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readFileSync).mockReturnValue('FIGMA_PAT=local-token')
      process.env.FIGMA_PAT = 'env-token'
      const result = await readFigmaPAT()
      expect(result).toBe('local-token')
    })

    it('should fallback to env var when .env.local not found', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      process.env.FIGMA_PAT = 'env-token'
      const result = await readFigmaPAT()
      expect(result).toBe('env-token')
    })

    it('should fallback to keychain if env not available', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      })

      vi.mocked(existsSync).mockReturnValue(false)
      process.env.USER = 'testuser'
      vi.mocked(execSync).mockReturnValue('keychain-token' as any)

      const result = await readFigmaPAT()
      expect(result).toBe('keychain-token')

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true
      })
    })

    it('should throw error when no PAT found', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      })

      await expect(readFigmaPAT()).rejects.toThrow('未找到 Figma PAT')

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true
      })
    })
  })
})
