import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const PACKAGE_NAME = 'figma-to-code'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const NPM_VIEW_TIMEOUT_MS = 5000

export interface UpdateInfo {
  current: string
  latest: string
  installCmd: string
  isPrerelease: boolean
}

interface CacheEntry {
  latest: string
  checkedAt: number
}

function cachePath(): string {
  return join(homedir(), '.cache', 'figma-to-code', 'version-check.json')
}

function readCache(): CacheEntry | null {
  const p = cachePath()
  if (!existsSync(p)) return null
  try {
    const data = JSON.parse(readFileSync(p, 'utf-8')) as CacheEntry
    if (typeof data.latest !== 'string' || typeof data.checkedAt !== 'number') return null
    return data
  } catch {
    return null
  }
}

function writeCache(entry: CacheEntry): void {
  const p = cachePath()
  try {
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, JSON.stringify(entry), 'utf-8')
  } catch {
    // 缓存写入失败静默忽略
  }
}

function queryLatestFromRegistry(): string | null {
  try {
    const out = execSync(`npm view ${PACKAGE_NAME} version`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: NPM_VIEW_TIMEOUT_MS,
      encoding: 'utf-8',
    })
    const v = out.trim()
    return /^\d+\.\d+\.\d+/.test(v) ? v : null
  } catch {
    return null
  }
}

/** 比较 semver：a < b 返回负数、a > b 返回正数、相等返回 0。无预发布标签的稳定版 > 带预发布标签的版本 */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) => {
    const [core, pre] = v.split('-')
    return {
      parts: core.split('.').map(n => parseInt(n, 10) || 0),
      pre: pre ?? '',
    }
  }
  const pa = parse(a)
  const pb = parse(b)
  for (let i = 0; i < 3; i++) {
    const ai = pa.parts[i] ?? 0
    const bi = pb.parts[i] ?? 0
    if (ai !== bi) return ai - bi
  }
  if (!pa.pre && pb.pre) return 1
  if (pa.pre && !pb.pre) return -1
  return pa.pre.localeCompare(pb.pre)
}

/**
 * 检查是否有可用更新。
 * - 复用 24h 缓存避免频繁命中 registry
 * - 网络/权限任何异常返回 null
 */
export function checkForUpdate(currentVersion: string, options: { force?: boolean } = {}): UpdateInfo | null {
  const now = Date.now()
  let latest: string | null = null

  const cached = options.force ? null : readCache()
  if (cached && now - cached.checkedAt < CACHE_TTL_MS) {
    latest = cached.latest
  } else {
    latest = queryLatestFromRegistry()
    if (latest) writeCache({ latest, checkedAt: now })
    else if (cached) latest = cached.latest // 网络失败时降级用旧缓存
  }

  if (!latest) return null
  if (compareSemver(currentVersion, latest) >= 0) return null

  return {
    current: currentVersion,
    latest,
    installCmd: `pnpm add -g ${PACKAGE_NAME}@${latest}`,
    isPrerelease: currentVersion.includes('-'),
  }
}

/**
 * 尝试执行自动升级（仅在用户显式开启时）。失败静默。
 */
export function runAutoUpdate(targetVersion: string): boolean {
  try {
    execSync(`pnpm add -g ${PACKAGE_NAME}@${targetVersion}`, {
      stdio: ['ignore', 'inherit', 'inherit'],
      timeout: 60_000,
    })
    return true
  } catch {
    return false
  }
}

/**
 * 将更新提示写到 stderr。只输出一条清晰横幅 + 安装命令。
 */
export function printUpdateBanner(info: UpdateInfo): void {
  const autoHint = process.env.FIGMA_TO_CODE_AUTO_UPDATE === '1'
    ? '（已开启 FIGMA_TO_CODE_AUTO_UPDATE=1，正在自动升级）'
    : '设置 FIGMA_TO_CODE_AUTO_UPDATE=1 可自动升级，或手动运行：'
  console.error('')
  console.error('┌─────────────────────────────────────────────────────────────┐')
  console.error(`│ figma-to-code: 发现新版本 ${info.latest}（当前 ${info.current}）`.padEnd(62) + '│')
  console.error(`│ ${autoHint}`.padEnd(62) + '│')
  console.error(`│   ${info.installCmd}`.padEnd(62) + '│')
  console.error('└─────────────────────────────────────────────────────────────┘')
}
