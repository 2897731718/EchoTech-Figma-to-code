import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

const KEYCHAIN_SERVICES = ['FIGMA_PAT_GLOBAL', 'FIGMA_PAT'] as const

function isMacOS(): boolean {
  return process.platform === 'darwin'
}

export function readPATFromEnv(): string | null {
  // 优先读取项目级 .env.local（优先级高于环境变量）
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
    } catch {
      // .env.local 读取失败，继续尝试环境变量
    }
  }

  // 最后检查环境变量
  const envValue = process.env.FIGMA_PAT
  if (envValue && envValue.trim().length > 0) {
    return envValue.trim()
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
    '未找到 Figma PAT，请通过以下任一方式配置：\n\n' +
      '  方式一：macOS Keychain（推荐，跨项目共用）\n' +
      '    security add-generic-password -a "$(whoami)" -s FIGMA_PAT_GLOBAL -w "你的TOKEN"\n\n' +
      '  方式二：项目 .env.local\n' +
      '    echo \'FIGMA_PAT=你的TOKEN\' >> .env.local\n\n' +
      '  获取 Token：Figma 左上角 Logo → Help and account → Account settings → Security → Personal access tokens'
  )
}
