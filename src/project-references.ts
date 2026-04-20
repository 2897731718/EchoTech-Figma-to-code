import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 扫描目标项目根目录下可供 IDE AI 参考的约定文档（.md）。
 *
 * 仅看项目根的 `CLAUDE.md` / `AGENTS.md` —— 这是 Flutter 项目的约定位置。
 * 返回**相对 cwd 的路径**，IDE AI 拼上项目根即可 Read。
 */
export function findProjectReferenceFiles(cwd: string = process.cwd()): string[] {
  const found: string[] = []
  for (const c of ['CLAUDE.md', 'AGENTS.md']) {
    if (existsSync(join(cwd, c))) found.push(c)
  }
  return found
}
