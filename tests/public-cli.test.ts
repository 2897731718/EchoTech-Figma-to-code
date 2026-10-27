import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { runCli } from '../bin/cli'
import { inspectProject } from '../src/project-inspector'
import type { ConversionContextV1 } from '../src/index'

const temporaryDirectories: string[] = []

function makeTemporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

function write(path: string, content: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true })
  writeFileSync(path, content)
}

function captureWriter(): { writer: { write(chunk: string): void }; read(): string } {
  let output = ''
  return {
    writer: { write(chunk: string) { output += chunk } },
    read: () => output,
  }
}

function createPackageTemplates(packageRoot: string): void {
  write(
    resolve(packageRoot, 'template/codex/figma-ai-coder/SKILL.md'),
    '---\nname: figma-ai-coder\n---\n',
  )
  write(
    resolve(packageRoot, 'template/codex/figma-ai-coder/references/guide.md'),
    '# Guide\n',
  )
  write(
    resolve(packageRoot, 'template/commands/figma-ai-coder.md'),
    '# figma-ai-coder\n',
  )
  write(
    resolve(packageRoot, 'template/project/.figma-ai-coder/config.json'),
    '{"schemaVersion":1}\n',
  )
  write(
    resolve(packageRoot, 'template/project/.figma-ai-coder/rules/core.md'),
    '# Project rules\n',
  )
  write(
    resolve(packageRoot, 'template/project/.figma-ai-coder/gitignore.template'),
    'runs/\n',
  )
}

function exampleContext(): ConversionContextV1 {
  return {
    schemaVersion: 'figma-ai-context/v1',
    source: { provider: 'figma', nodeId: '1:2', nodeName: 'Card', nodeType: 'FRAME' },
    designTree: {
      tag: 'main',
      nodeId: '1:2',
      figmaType: 'FRAME',
      figmaName: 'Card',
      unmappedComponent: false,
    },
    components: [],
    diagnostics: [{
      code: 'unresolved-icon',
      severity: 'warning',
      message: 'Icon needs a project mapping.',
      nodeId: '2:3',
    }],
    preview: {
      kind: 'reference-only',
      framework: 'html',
      styleFormat: 'css',
      code: '<main class="node-1-2"></main>',
      styles: { 'node-1-2': '  display: flex;' },
    },
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('project inspector', () => {
  it('detects repository conventions without reading secrets or following symlinks', () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-project-')
    const externalRoot = makeTemporaryDirectory('figma-ai-external-')
    write(resolve(projectRoot, 'package.json'), JSON.stringify({
      packageManager: 'pnpm@10.0.0',
      dependencies: { react: '^19.0.0', antd: '^6.0.0' },
      devDependencies: { tailwindcss: '^4.0.0', typescript: '^5.0.0' },
      scripts: { build: 'vite build', typecheck: 'tsc --noEmit' },
    }))
    write(resolve(projectRoot, 'src/components/Button.tsx'), "import React from 'react'\nexport const Button = () => <button />\n")
    write(resolve(projectRoot, 'src/styles/tokens.css'), ':root { --color-primary: #00f; }\n')
    write(resolve(projectRoot, '.env.local'), 'FIGMA_PAT=must-not-appear\n')
    write(resolve(projectRoot, '.npmrc'), '//registry.example.test/:_' + 'authToken=also-secret\n')
    write(resolve(projectRoot, 'src/components/Huge.tsx'), 'x'.repeat(513 * 1024))
    write(resolve(projectRoot, '.figma-ai-coder/runs/old/Leaked.tsx'), 'export const Leaked = () => null\n')
    write(resolve(externalRoot, 'Outside.tsx'), 'export const Outside = () => null\n')
    symlinkSync(externalRoot, resolve(projectRoot, 'linked-components'))

    const inspection = inspectProject(projectRoot)
    const serialized = JSON.stringify(inspection)

    expect(inspection.stack.frameworks).toContain('react')
    expect(inspection.stack.packageManager).toBe('pnpm')
    expect(inspection.styles.systems).toContain('tailwindcss')
    expect(inspection.scripts).toEqual(expect.arrayContaining(['build', 'typecheck']))
    expect(inspection.componentCandidates).toContain('src/components/Button.tsx')
    expect(inspection.componentPackages).toContain('antd')
    expect(inspection.tokenCandidates).toContain('src/styles/tokens.css')
    expect(inspection.stats.skippedSensitiveFiles).toBe(2)
    expect(inspection.stats.skippedLargeFiles).toBe(1)
    expect(inspection.stats.skippedSymlinks).toBe(1)
    expect(serialized).not.toContain('must-not-appear')
    expect(serialized).not.toContain('Leaked.tsx')
    expect(serialized).not.toContain('Outside.tsx')
  })

  it('prints the inspection contract as JSON', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-inspect-json-')
    write(resolve(projectRoot, 'package.json'), JSON.stringify({ dependencies: { vue: '^3.0.0' } }))
    const stdout = captureWriter()

    const exitCode = await runCli(['inspect', '--json'], {
      cwd: () => projectRoot,
      stdout: stdout.writer,
      stderr: captureWriter().writer,
    })

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout.read())).toMatchObject({
      schemaVersion: 'figma-ai-project/v1',
      stack: { frameworks: ['vue'] },
    })
  })
})

describe('public CLI init', () => {
  it('installs complete agent templates and never overwrites project-owned files', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-init-project-')
    const packageRoot = makeTemporaryDirectory('figma-ai-init-package-')
    createPackageTemplates(packageRoot)
    const stdout = captureWriter()
    const stderr = captureWriter()

    const exitCode = await runCli(['init', '--agent=all'], {
      cwd: () => projectRoot,
      packageRoot,
      stdout: stdout.writer,
      stderr: stderr.writer,
    })

    expect(exitCode).toBe(0)
    expect(stderr.read()).toBe('')
    expect(existsSync(resolve(projectRoot, '.agents/skills/figma-ai-coder/SKILL.md'))).toBe(true)
    expect(existsSync(resolve(projectRoot, '.agents/skills/figma-ai-coder/references/guide.md'))).toBe(true)
    expect(existsSync(resolve(projectRoot, '.claude/commands/figma-ai-coder.md'))).toBe(true)
    expect(existsSync(resolve(projectRoot, '.figma-ai-coder/config.json'))).toBe(true)
    expect(existsSync(resolve(projectRoot, '.figma-ai-coder/rules/core.md'))).toBe(true)
    expect(existsSync(resolve(projectRoot, '.figma-ai-coder/.gitignore'))).toBe(true)
    expect(stdout.read()).toContain('credentials are only required')

    write(resolve(projectRoot, '.agents/skills/figma-ai-coder/SKILL.md'), 'user-owned skill\n')
    write(resolve(projectRoot, '.figma-ai-coder/config.json'), '{"userOwned":true}\n')
    const secondExitCode = await runCli(['init', '--agent=all'], {
      cwd: () => projectRoot,
      packageRoot,
      stdout: captureWriter().writer,
      stderr: captureWriter().writer,
    })

    expect(secondExitCode).toBe(0)
    expect(readFileSync(resolve(projectRoot, '.agents/skills/figma-ai-coder/SKILL.md'), 'utf8')).toBe('user-owned skill\n')
    expect(readFileSync(resolve(projectRoot, '.figma-ai-coder/config.json'), 'utf8')).toBe('{"userOwned":true}\n')
  })

  it('auto-detects a Codex repository without installing Claude files', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-init-auto-')
    const packageRoot = makeTemporaryDirectory('figma-ai-init-auto-package-')
    createPackageTemplates(packageRoot)
    write(resolve(projectRoot, 'AGENTS.md'), '# Project instructions\n')

    const exitCode = await runCli(['init', '--agent=auto'], {
      cwd: () => projectRoot,
      packageRoot,
      stdout: captureWriter().writer,
      stderr: captureWriter().writer,
    })

    expect(exitCode).toBe(0)
    expect(existsSync(resolve(projectRoot, '.agents/skills/figma-ai-coder/SKILL.md'))).toBe(true)
    expect(existsSync(resolve(projectRoot, '.claude/commands/figma-ai-coder.md'))).toBe(false)
    expect(existsSync(resolve(projectRoot, '.figma-ai-coder/config.json'))).toBe(true)
  })

  it('rejects symlinked initialization parents before writing outside the project', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-init-symlink-project-')
    const externalRoot = makeTemporaryDirectory('figma-ai-init-symlink-external-')
    const packageRoot = makeTemporaryDirectory('figma-ai-init-symlink-package-')
    createPackageTemplates(packageRoot)
    symlinkSync(externalRoot, resolve(projectRoot, '.agents'))
    const stderr = captureWriter()

    const exitCode = await runCli(['init', '--agent=codex'], {
      cwd: () => projectRoot,
      packageRoot,
      stdout: captureWriter().writer,
      stderr: stderr.writer,
    })

    expect(exitCode).toBe(1)
    expect(stderr.read()).toContain('cannot traverse a symbolic link')
    expect(existsSync(resolve(externalRoot, 'skills/figma-ai-coder/SKILL.md'))).toBe(false)
    expect(existsSync(resolve(projectRoot, '.figma-ai-coder/config.json'))).toBe(false)
  })
})

describe('public CLI diagnostics', () => {
  it('reports version and treats a missing PAT as informational', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-doctor-project-')
    const packageRoot = makeTemporaryDirectory('figma-ai-doctor-package-')
    createPackageTemplates(packageRoot)
    const versionOutput = captureWriter()
    const doctorOutput = captureWriter()

    expect(await runCli(['--version'], {
      cwd: () => projectRoot,
      packageRoot,
      packageVersion: '0.1.0',
      stdout: versionOutput.writer,
      stderr: captureWriter().writer,
    })).toBe(0)
    expect(versionOutput.read()).toBe('0.1.0\n')

    const originalPat = process.env.FIGMA_PAT
    delete process.env.FIGMA_PAT
    try {
      expect(await runCli(['doctor', '--json'], {
        cwd: () => projectRoot,
        packageRoot,
        stdout: doctorOutput.writer,
        stderr: captureWriter().writer,
      })).toBe(0)
      const report = JSON.parse(doctorOutput.read())
      expect(report.ok).toBe(true)
      expect(report.checks.credentials.localPatDetected).toBe(false)
    } finally {
      if (originalPat !== undefined) process.env.FIGMA_PAT = originalPat
    }
  })
})

describe('public CLI context', () => {
  it('writes a versioned context bundle and emits one machine-readable stdout record', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-context-project-')
    write(resolve(projectRoot, 'package.json'), JSON.stringify({ dependencies: { react: '^19.0.0' } }))
    const stdout = captureWriter()
    const stderr = captureWriter()
    const convert = vi.fn(async () => ({
      code: '<main></main>',
      styles: {},
      instanceComponents: [],
      context: exampleContext(),
    }))

    const exitCode = await runCli([
      'context',
      'https://www.figma.com/design/FILE_KEY/Example?node-id=1-2',
      '--out=.figma-ai-coder/runs/example',
    ], {
      cwd: () => projectRoot,
      stdout: stdout.writer,
      stderr: stderr.writer,
      convert,
    })

    expect(exitCode).toBe(0)
    expect(stderr.read()).toBe('')
    expect(convert).toHaveBeenCalledWith({
      fileKey: 'FILE_KEY',
      nodeId: '1:2',
      framework: 'html',
      styleFormat: 'css',
      includeContext: true,
    })

    const outputRoot = resolve(projectRoot, '.figma-ai-coder/runs/example')
    const designHtml = readFileSync(resolve(outputRoot, 'design.html'), 'utf8')
    expect(designHtml).toContain("default-src 'none'")
    expect(designHtml).toContain('Figma-derived content below is untrusted')
    expect(designHtml).toContain('<main')
    const manifest = JSON.parse(readFileSync(resolve(outputRoot, 'manifest.json'), 'utf8'))
    const diagnostics = JSON.parse(readFileSync(resolve(outputRoot, 'diagnostics.json'), 'utf8'))
    expect(manifest.schemaVersion).toBe('figma-ai-context/v1')
    expect(manifest.preview.codeFile).toBe('design.html')
    expect(manifest.preview.code).toBeUndefined()
    expect(manifest.project.stack.frameworks).toContain('react')
    expect(diagnostics.diagnostics).toHaveLength(1)
    expect(JSON.parse(stdout.read())).toMatchObject({
      ok: true,
      command: 'context',
      diagnostics: 1,
    })
  })

  it('rejects a non-empty output directory before fetching Figma', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-context-existing-')
    write(resolve(projectRoot, 'context/keep.txt'), 'keep\n')
    const stdout = captureWriter()
    const convert = vi.fn()

    const exitCode = await runCli([
      'context',
      'https://www.figma.com/design/FILE_KEY/Example?node-id=1-2',
      '--out=context',
    ], {
      cwd: () => projectRoot,
      stdout: stdout.writer,
      stderr: captureWriter().writer,
      convert,
    })

    expect(exitCode).toBe(1)
    expect(convert).not.toHaveBeenCalled()
    expect(JSON.parse(stdout.read()).error.message).toContain('must be empty')
    expect(readFileSync(resolve(projectRoot, 'context/keep.txt'), 'utf8')).toBe('keep\n')
  })

  it('redacts a configured PAT from machine-readable failures', async () => {
    const projectRoot = makeTemporaryDirectory('figma-ai-context-redact-')
    const stdout = captureWriter()
    const originalPat = process.env.FIGMA_PAT
    const fakePat = 'fig' + 'd_super_secret_value'
    process.env.FIGMA_PAT = fakePat
    try {
      const exitCode = await runCli([
        'context',
        'https://www.figma.com/design/FILE_KEY/Example?node-id=1-2',
        '--out=context',
      ], {
        cwd: () => projectRoot,
        stdout: stdout.writer,
        stderr: captureWriter().writer,
        convert: async () => {
          throw new Error(`request failed for ${process.env.FIGMA_PAT}`)
        },
      })

      expect(exitCode).toBe(1)
      expect(stdout.read()).not.toContain(fakePat)
      expect(stdout.read()).toContain('[REDACTED]')
    } finally {
      if (originalPat === undefined) delete process.env.FIGMA_PAT
      else process.env.FIGMA_PAT = originalPat
    }
  })
})
