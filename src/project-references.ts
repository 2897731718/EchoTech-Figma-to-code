import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 扫描目标项目中可供 IDE AI 参考的约定文档（.md）。
 *
 * 返回路径均为**相对 cwd 的路径**（如 `.claude/figma-context.md`），
 * 便于写入骨架注释时保持简洁；IDE AI 拼上项目根即可 Read。
 *
 * 扫描范围：
 * - `CLAUDE.md` / `AGENTS.md`（项目根）
 * - `.claude/figma-context*.md`（init 生成的规则文件，支持多个框架后缀）
 */
export function findProjectReferenceFiles(cwd: string = process.cwd()): string[] {
  const found: string[] = []

  const rootCandidates = ['CLAUDE.md', 'AGENTS.md']
  for (const c of rootCandidates) {
    if (existsSync(join(cwd, c))) found.push(c)
  }

  const claudeDir = join(cwd, '.claude')
  if (existsSync(claudeDir)) {
    try {
      const files = readdirSync(claudeDir)
      for (const f of files.sort()) {
        if (/^figma-context.*\.md$/i.test(f)) {
          found.push(`.claude/${f}`)
        }
      }
    } catch {
      // 目录读取失败静默
    }
  }

  return found
}
