import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

const KEYCHAIN_SERVICES = ['FIGMA_PAT_GLOBAL', 'FIGMA_PAT'] as const

function isMacOS(): boolean {
  return process.platform === 'darwin'
}

export function readPATFromEnv(): string | null {
  const envValue = process.env.FIGMA_PAT
  if (envValue && envValue.trim().length > 0) {
    return envValue.trim()
  }

  const projectRoot = cwd()
  const envLocalPath = join(projectRoot, '.env.local')

  if (existsSync(envLocalPath)) {
    try {
      const content = readFileSync(envLocalPath, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('#') || !trimmed.includes('=')) {
          continue
        }

        const [key, ...valueParts] = trimmed.split('=')
        const envKey = key.trim()
        const envValue = valueParts.join('=').trim()

        if (envKey === 'FIGMA_PAT' && envValue.length > 0) {
          return envValue.replace(/^["']|["']$/g, '')
        }
      }
    } catch (error) {
      return null
    }
  }

  return null
}

export function readPATFromKeychain(): string | null {
  if (!isMacOS()) {
    return null
  }

  for (const service of KEYCHAIN_SERVICES) {
    try {
      const username = process.env.USER || process.env.USERNAME || ''
      const command = `security find-generic-password -a "${username}" -s "${service}" -w 2>/dev/null`
      const result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim()

      if (result && result.length > 0) {
        return result
      }
    } catch {
      continue
    }
  }

  return null
}

export async function readFigmaPAT(): Promise<string> {
  const fromEnv = readPATFromEnv()
  if (fromEnv) {
    return fromEnv
  }

  const fromKeychain = readPATFromKeychain()
  if (fromKeychain) {
    return fromKeychain
  }

  throw new Error(
    'Figma PAT not found. Please configure it using one of the following methods:\n' +
      '1. Set FIGMA_PAT in .env.local file in project root\n' +
      '2. Store in macOS Keychain with service name FIGMA_PAT or FIGMA_PAT_GLOBAL\n' +
      '   Command: security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "<YOUR_TOKEN>"'
  )
}
