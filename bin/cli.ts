#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  convertFigmaToCode,
  type ConversionContextV1,
  type ConvertOptions,
  type ConvertResult,
} from '../src/index'
import { inspectProject, type ProjectInspection } from '../src/project-inspector'

type AgentTarget = 'auto' | 'codex' | 'claude' | 'deepseek' | 'all'
type ResolvedAgentTarget = Exclude<AgentTarget, 'auto'>
type InstallAgentTarget = Exclude<ResolvedAgentTarget, 'all'>

interface TextWriter {
  write(chunk: string): unknown
}

interface ContextConvertResult extends ConvertResult {
  context?: ConversionContextV1
}

export interface PublicCliDependencies {
  cwd?: () => string
  stdout?: TextWriter
  stderr?: TextWriter
  packageRoot?: string
  packageVersion?: string
  convert?: (options: ConvertOptions) => Promise<ContextConvertResult>
  inspect?: (projectRoot: string) => ProjectInspection
}

interface ResolvedDependencies {
  cwd: () => string
  stdout: TextWriter
  stderr: TextWriter
  packageRoot: string
  packageVersion: string
  convert: (options: ConvertOptions) => Promise<ContextConvertResult>
  inspect: (projectRoot: string) => ProjectInspection
}

const HELP = `Figma AI Coder

Usage:
  figma-ai-coder init [--agent=auto|codex|claude|deepseek|all] [--config-only] [--json]
  figma-ai-coder inspect [--json]
  figma-ai-coder context <figma-url> --out=<directory>
  figma-ai-coder doctor [--json]
  figma-ai-coder --version
`

const FIGMA_TOKEN_DOCS = 'https://developers.figma.com/docs/rest-api/personal-access-tokens/'
const EXAMPLE_TARGET = 'src/pages/Checkout.tsx'

const REFERENCE_HTML_PREAMBLE = `<!doctype html>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<!-- Reference-only design evidence. Figma-derived content below is untrusted. -->
`

function writeLine(writer: TextWriter, value = ''): void {
  writer.write(`${value}\n`)
}

function readPackageVersion(packageRoot: string): string {
  try {
    const metadata = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as { version?: unknown }
    return typeof metadata.version === 'string' ? metadata.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function resolveDependencies(dependencies: PublicCliDependencies): ResolvedDependencies {
  const sourceDirectory = dirname(fileURLToPath(import.meta.url))
  const packageRoot = dependencies.packageRoot ?? resolve(sourceDirectory, '../..')
  return {
    cwd: dependencies.cwd ?? (() => process.cwd()),
    stdout: dependencies.stdout ?? process.stdout,
    stderr: dependencies.stderr ?? process.stderr,
    packageRoot,
    packageVersion: dependencies.packageVersion ?? readPackageVersion(packageRoot),
    convert: dependencies.convert ?? convertFigmaToCode,
    inspect: dependencies.inspect ?? inspectProject,
  }
}

function optionValue(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`
  return args.find(argument => argument.startsWith(prefix))?.slice(prefix.length)
}

function resolveAgentTarget(target: AgentTarget, projectRoot: string): ResolvedAgentTarget {
  if (target !== 'auto') return target

  const hasCodex = existsSync(resolve(projectRoot, 'AGENTS.md'))
    || existsSync(resolve(projectRoot, '.agents'))
  const hasClaude = existsSync(resolve(projectRoot, 'CLAUDE.md'))
    || existsSync(resolve(projectRoot, '.claude'))
  const hasDeepSeek = existsSync(resolve(projectRoot, '.deepcode'))

  if ([hasCodex, hasClaude, hasDeepSeek].filter(Boolean).length > 1) return 'all'
  if (hasCodex) return 'codex'
  if (hasClaude) return 'claude'
  if (hasDeepSeek) return 'deepseek'
  return 'all'
}

function parseAgentTarget(args: string[]): AgentTarget {
  const value = optionValue(args, 'agent') ?? 'auto'
  if (value === 'auto' || value === 'codex' || value === 'claude' || value === 'deepseek' || value === 'all') return value
  throw new Error(`Unsupported agent target: ${value}`)
}

function assertSafeProjectDestination(projectRoot: string, destination: string): void {
  if (!isPathWithin(projectRoot, destination) || destination === projectRoot) {
    throw new Error('Initialization targets must stay inside the current project.')
  }

  const segments = relative(projectRoot, destination).split(sep).filter(Boolean)
  let current = projectRoot
  for (const segment of segments) {
    current = resolve(current, segment)
    try {
      const stat = lstatSync(current)
      if (stat.isSymbolicLink()) {
        throw new Error(`Initialization target cannot traverse a symbolic link: ${displayPath(projectRoot, current)}`)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
}

function copyDirectoryIfMissing(source: string, destination: string, created: string[], skipped: string[]): void {
  if (existsSync(destination)) {
    skipped.push(destination)
    return
  }
  mkdirSync(dirname(destination), { recursive: true })
  cpSync(source, destination, { recursive: true, errorOnExist: true, force: false })
  created.push(destination)
}

function copyFileIfMissing(source: string, destination: string, created: string[], skipped: string[]): void {
  if (existsSync(destination)) {
    skipped.push(destination)
    return
  }
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, readFileSync(source), { flag: 'wx' })
  created.push(destination)
}

function displayPath(projectRoot: string, path: string): string {
  const rel = relative(projectRoot, path)
  return rel ? rel.split(sep).join('/') : '.'
}

function runInit(args: string[], dependencies: ResolvedDependencies): number {
  const projectRoot = realpathSync(resolve(dependencies.cwd()))
  const requestedTarget = parseAgentTarget(args)
  const target = resolveAgentTarget(requestedTarget, projectRoot)
  const configOnly = args.includes('--config-only')
  const json = args.includes('--json')
  const templateRoot = resolve(dependencies.packageRoot, 'template')

  const skillSource = resolve(templateRoot, 'skills/figma-ai-coder')
  const claudeCommandSource = resolve(templateRoot, 'commands/figma-ai-coder.md')
  const projectTemplateRoot = resolve(templateRoot, 'project/.figma-ai-coder')
  const installTargets: InstallAgentTarget[] = configOnly
    ? []
    : target === 'all'
      ? ['codex', 'claude', 'deepseek']
      : [target]
  const installsPortableAgentsSkill = installTargets.includes('codex') || installTargets.includes('deepseek')
  const installsClaude = installTargets.includes('claude')
  const requiredSources = [
    ...(installTargets.length > 0 ? [skillSource] : []),
    ...(installsClaude ? [claudeCommandSource] : []),
    resolve(projectTemplateRoot, 'config.json'),
    resolve(projectTemplateRoot, 'rules/core.md'),
    resolve(projectTemplateRoot, 'gitignore.template'),
  ]

  for (const source of requiredSources) {
    if (!existsSync(source)) throw new Error(`Package template is missing: ${relative(dependencies.packageRoot, source)}`)
  }

  const created: string[] = []
  const skipped: string[] = []
  const codexDestination = resolve(projectRoot, '.agents/skills/figma-ai-coder')
  const claudeDestination = resolve(projectRoot, '.claude/skills/figma-ai-coder')
  const claudeCommandDestination = resolve(projectRoot, '.claude/commands/figma-ai-coder.md')
  const deepSeekDestination = resolve(projectRoot, '.deepcode/skills/figma-ai-coder')
  const projectStateRoot = resolve(projectRoot, '.figma-ai-coder')
  const projectDestinations = [
    ...(installsPortableAgentsSkill ? [codexDestination] : []),
    ...(installsClaude ? [claudeDestination, claudeCommandDestination] : []),
    ...(installTargets.includes('deepseek') ? [deepSeekDestination] : []),
    resolve(projectStateRoot, 'config.json'),
    resolve(projectStateRoot, 'rules/core.md'),
    resolve(projectStateRoot, '.gitignore'),
  ]
  for (const destination of projectDestinations) {
    assertSafeProjectDestination(projectRoot, destination)
  }

  if (installsPortableAgentsSkill) {
    copyDirectoryIfMissing(
      skillSource,
      codexDestination,
      created,
      skipped,
    )
  }
  if (installsClaude) {
    copyDirectoryIfMissing(
      skillSource,
      claudeDestination,
      created,
      skipped,
    )
    copyFileIfMissing(
      claudeCommandSource,
      claudeCommandDestination,
      created,
      skipped,
    )
  }
  if (installTargets.includes('deepseek')) {
    copyDirectoryIfMissing(
      skillSource,
      deepSeekDestination,
      created,
      skipped,
    )
  }

  copyFileIfMissing(resolve(projectTemplateRoot, 'config.json'), resolve(projectStateRoot, 'config.json'), created, skipped)
  copyFileIfMissing(resolve(projectTemplateRoot, 'rules/core.md'), resolve(projectStateRoot, 'rules/core.md'), created, skipped)
  copyFileIfMissing(resolve(projectTemplateRoot, 'gitignore.template'), resolve(projectStateRoot, '.gitignore'), created, skipped)

  const localPatDetected = hasLocalPatHint(projectRoot)
  const result = {
    ok: true,
    command: 'init',
    target,
    configOnly,
    created: created.map(path => displayPath(projectRoot, path)),
    preserved: skipped.map(path => displayPath(projectRoot, path)),
    credentials: {
      figmaPatHintDetected: localPatDetected,
      docs: FIGMA_TOKEN_DOCS,
    },
    next: {
      requiredInput: ['figmaUrl', 'sourceTarget'],
      exampleTarget: EXAMPLE_TARGET,
      contextOutput: '.figma-ai-coder/runs/<run-id>/',
      finalCodeOutput: '<user-confirmed-source-target>',
    },
  }

  if (json) {
    writeLine(dependencies.stdout, JSON.stringify(result, null, 2))
    return 0
  }

  writeLine(dependencies.stdout, `Figma AI Coder initialized for ${configOnly ? 'project configuration only' : target}.`)
  for (const path of created) writeLine(dependencies.stdout, `created ${displayPath(projectRoot, path)}`)
  for (const path of skipped) writeLine(dependencies.stdout, `preserved ${displayPath(projectRoot, path)}`)
  writeLine(dependencies.stdout)
  if (localPatDetected) {
    writeLine(dependencies.stdout, 'ok FIGMA_PAT configuration hint detected; its value was not printed.')
  } else {
    writeLine(dependencies.stdout, 'next configure FIGMA_PAT locally before fetching design context.')
    writeLine(dependencies.stdout, `docs ${FIGMA_TOKEN_DOCS}`)
    writeLine(dependencies.stdout, 'example export FIGMA_PAT="your-figma-personal-access-token"')
    writeLine(dependencies.stdout, 'Never paste the token into an AI conversation or commit it to the repository.')
  }
  writeLine(dependencies.stdout, 'next give the Agent both a Figma URL and the final source target.')
  writeLine(dependencies.stdout, `example target ${EXAMPLE_TARGET}`)
  writeLine(dependencies.stdout, 'design evidence .figma-ai-coder/runs/<run-id>/')
  writeLine(dependencies.stdout, 'final code <user-confirmed-source-target>')
  return 0
}

function printInspection(inspection: ProjectInspection, writer: TextWriter): void {
  writeLine(writer, `Frameworks: ${inspection.stack.frameworks.join(', ') || 'not detected'}`)
  writeLine(writer, `Languages: ${inspection.stack.languages.join(', ') || 'not detected'}`)
  writeLine(writer, `Styles: ${inspection.styles.systems.join(', ') || 'plain CSS / not detected'}`)
  writeLine(writer, `Scripts: ${inspection.scripts.join(', ') || 'none'}`)
  writeLine(writer, `Component candidates: ${inspection.componentCandidates.length}`)
  writeLine(writer, `Token candidates: ${inspection.tokenCandidates.length}`)
}

function runInspect(args: string[], dependencies: ResolvedDependencies): number {
  const inspection = dependencies.inspect(dependencies.cwd())
  if (args.includes('--json')) {
    writeLine(dependencies.stdout, JSON.stringify(inspection, null, 2))
  } else {
    printInspection(inspection, dependencies.stdout)
  }
  return 0
}

function parseFigmaUrl(value: string): { fileKey: string; nodeId?: string } {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('A valid Figma design URL is required.')
  }

  const hostname = url.hostname.toLowerCase()
  if (hostname !== 'figma.com' && hostname !== 'www.figma.com') {
    throw new Error('A valid Figma design URL is required.')
  }
  const match = url.pathname.match(/^\/(?:file|design)\/([^/]+)/)
  if (!match) throw new Error('A valid Figma file or design URL is required.')

  const nodeIdValue = url.searchParams.get('node-id')
  return {
    fileKey: match[1],
    ...(nodeIdValue ? { nodeId: nodeIdValue.replace('-', ':') } : {}),
  }
}

function isPathWithin(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

function closestExistingAncestor(path: string): string {
  let current = path
  while (!existsSync(current)) {
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return current
}

function validateOutputDirectory(projectRoot: string, outputArgument: string): string {
  const root = realpathSync(resolve(projectRoot))
  const output = resolve(root, outputArgument)
  if (!isPathWithin(root, output) || output === root) {
    throw new Error('The context output directory must be inside the current project.')
  }

  const ancestor = closestExistingAncestor(output)
  const realAncestor = realpathSync(ancestor)
  if (!isPathWithin(root, realAncestor)) {
    throw new Error('The context output directory cannot traverse a symbolic link outside the project.')
  }

  if (existsSync(output)) {
    const stat = lstatSync(output)
    if (stat.isSymbolicLink()) throw new Error('The context output directory cannot be a symbolic link.')
    if (!stat.isDirectory()) throw new Error('The context output path must be a directory.')
    if (readdirSync(output).length > 0) throw new Error('The context output directory must be empty.')
  }

  return output
}

function buildManifest(context: ConversionContextV1, project: ProjectInspection): Record<string, unknown> {
  return {
    schemaVersion: context.schemaVersion,
    source: context.source,
    designTree: context.designTree,
    components: context.components,
    preview: {
      kind: context.preview.kind,
      framework: context.preview.framework,
      styleFormat: context.preview.styleFormat,
      codeFile: 'design.html',
      styles: context.preview.styles,
    },
    project,
  }
}

async function runContext(args: string[], dependencies: ResolvedDependencies): Promise<number> {
  const urlArgument = args.find(argument => !argument.startsWith('-'))
  const outputArgument = optionValue(args, 'out')
  if (!urlArgument) throw new Error('A Figma design URL is required.')
  if (!outputArgument) throw new Error('The --out=<directory> option is required.')

  const projectRoot = realpathSync(resolve(dependencies.cwd()))
  const outputDirectory = validateOutputDirectory(projectRoot, outputArgument)
  const { fileKey, nodeId } = parseFigmaUrl(urlArgument)
  const project = dependencies.inspect(projectRoot)
  const result = await dependencies.convert({
    fileKey,
    nodeId,
    framework: 'html',
    styleFormat: 'css',
    includeContext: true,
  })
  if (!result.context) throw new Error('The shared converter did not return the requested AI context.')

  const designHtml = `${REFERENCE_HTML_PREAMBLE}${result.context.preview.code.trimEnd()}\n`
  const manifest = `${JSON.stringify(buildManifest(result.context, project), null, 2)}\n`
  const diagnostics = `${JSON.stringify({
    schemaVersion: 'figma-ai-diagnostics/v1',
    sourceSchemaVersion: result.context.schemaVersion,
    diagnostics: result.context.diagnostics,
  }, null, 2)}\n`

  mkdirSync(outputDirectory, { recursive: true })
  writeFileSync(resolve(outputDirectory, 'design.html'), designHtml, { flag: 'wx' })
  writeFileSync(resolve(outputDirectory, 'manifest.json'), manifest, { flag: 'wx' })
  writeFileSync(resolve(outputDirectory, 'diagnostics.json'), diagnostics, { flag: 'wx' })

  writeLine(dependencies.stdout, JSON.stringify({
    ok: true,
    command: 'context',
    outputDirectory: displayPath(projectRoot, outputDirectory),
    files: ['design.html', 'manifest.json', 'diagnostics.json'],
    diagnostics: result.context.diagnostics.length,
  }))
  return 0
}

function hasLocalPatHint(projectRoot: string): boolean {
  if (typeof process.env.FIGMA_PAT === 'string' && process.env.FIGMA_PAT.trim()) return true
  const envPath = resolve(projectRoot, '.env.local')
  if (!existsSync(envPath)) return false
  try {
    const stat = lstatSync(envPath)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64 * 1024) return false
    return /^\s*FIGMA_PAT\s*=\s*\S+/m.test(readFileSync(envPath, 'utf8'))
  } catch {
    return false
  }
}

function runDoctor(args: string[], dependencies: ResolvedDependencies): number {
  const projectRoot = realpathSync(resolve(dependencies.cwd()))
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10)
  let inspectionOk = true
  try {
    dependencies.inspect(projectRoot)
  } catch {
    inspectionOk = false
  }

  const checks = {
    node: { ok: nodeMajor >= 20, version: process.versions.node, required: '>=20' },
    projectInspection: { ok: inspectionOk },
    templates: {
      skill: existsSync(resolve(dependencies.packageRoot, 'template/skills/figma-ai-coder/SKILL.md')),
      claudeCommand: existsSync(resolve(dependencies.packageRoot, 'template/commands/figma-ai-coder.md')),
      project: existsSync(resolve(dependencies.packageRoot, 'template/project/.figma-ai-coder/config.json')),
    },
    credentials: {
      localPatHintDetected: hasLocalPatHint(projectRoot),
      docs: FIGMA_TOKEN_DOCS,
      note: 'macOS Keychain is checked only when design context is fetched',
    },
    installed: {
      portableAgentsProjectSkill: existsSync(resolve(projectRoot, '.agents/skills/figma-ai-coder/SKILL.md')),
      claudeProjectSkill: existsSync(resolve(projectRoot, '.claude/skills/figma-ai-coder/SKILL.md')),
      claudeLegacyCommand: existsSync(resolve(projectRoot, '.claude/commands/figma-ai-coder.md')),
      deepCodeProjectSkill: existsSync(resolve(projectRoot, '.deepcode/skills/figma-ai-coder/SKILL.md')),
      projectConfig: existsSync(resolve(projectRoot, '.figma-ai-coder/config.json')),
    },
  }
  const healthy = checks.node.ok
    && checks.projectInspection.ok
    && checks.templates.skill
    && checks.templates.claudeCommand
    && checks.templates.project

  if (args.includes('--json')) {
    writeLine(dependencies.stdout, JSON.stringify({ ok: healthy, checks }, null, 2))
  } else {
    writeLine(dependencies.stdout, `${checks.node.ok ? 'ok' : 'error'} Node.js ${checks.node.version} (requires ${checks.node.required})`)
    writeLine(dependencies.stdout, `${checks.projectInspection.ok ? 'ok' : 'error'} static project inspection`)
    writeLine(dependencies.stdout, `${checks.templates.skill && checks.templates.claudeCommand && checks.templates.project ? 'ok' : 'error'} package templates`)
    writeLine(dependencies.stdout, `${checks.credentials.localPatHintDetected ? 'ok' : 'info'} environment/.env.local Figma PAT hint ${checks.credentials.localPatHintDetected ? 'detected' : 'not detected'}`)
    if (!checks.credentials.localPatHintDetected) writeLine(dependencies.stdout, `docs ${FIGMA_TOKEN_DOCS}`)
    writeLine(dependencies.stdout, `${checks.installed.portableAgentsProjectSkill ? 'ok' : 'info'} Codex / DeepSeek Harness project Skill ${checks.installed.portableAgentsProjectSkill ? 'installed' : 'not installed'}`)
    writeLine(dependencies.stdout, `${checks.installed.claudeProjectSkill ? 'ok' : 'info'} Claude Code project Skill ${checks.installed.claudeProjectSkill ? 'installed' : 'not installed'}`)
    writeLine(dependencies.stdout, `${checks.installed.deepCodeProjectSkill ? 'ok' : 'info'} Deep Code project Skill ${checks.installed.deepCodeProjectSkill ? 'installed' : 'not installed'}`)
    writeLine(dependencies.stdout, `${checks.installed.projectConfig ? 'ok' : 'info'} project configuration ${checks.installed.projectConfig ? 'installed' : 'not installed'}`)
  }
  return healthy ? 0 : 1
}

function redactError(error: unknown): string {
  let message = error instanceof Error ? error.message : 'Unknown error'
  const configuredPat = process.env.FIGMA_PAT?.trim()
  if (configuredPat) message = message.replaceAll(configuredPat, '[REDACTED]')
  const figmaTokenPattern = new RegExp(`\\b${'fig' + 'd_'}[A-Za-z0-9_-]+\\b`, 'g')
  return message
    .replace(/FIGMA_PAT\s*=\s*[^\s]+/gi, 'FIGMA_PAT=[REDACTED]')
    .replace(figmaTokenPattern, '[REDACTED]')
    .slice(0, 500)
}

export async function runCli(args: string[], providedDependencies: PublicCliDependencies = {}): Promise<number> {
  const dependencies = resolveDependencies(providedDependencies)
  const command = args[0]

  try {
    if (args.includes('--version') || args.includes('-v')) {
      writeLine(dependencies.stdout, dependencies.packageVersion)
      return 0
    }
    if (!command || command === 'help' || args.includes('--help') || args.includes('-h')) {
      dependencies.stdout.write(HELP)
      return 0
    }
    if (command === 'init') return runInit(args.slice(1), dependencies)
    if (command === 'inspect') return runInspect(args.slice(1), dependencies)
    if (command === 'context') return await runContext(args.slice(1), dependencies)
    if (command === 'doctor') return runDoctor(args.slice(1), dependencies)
    throw new Error(`Unknown command: ${command}`)
  } catch (error) {
    const message = redactError(error)
    if (command === 'context') {
      writeLine(dependencies.stdout, JSON.stringify({
        ok: false,
        command: 'context',
        error: { code: 'CONTEXT_FAILED', message },
      }))
    } else {
      writeLine(dependencies.stderr, `figma-ai-coder: ${message}`)
    }
    return 1
  }
}

function isExecutedDirectly(): boolean {
  if (!process.argv[1]) return false
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))
  } catch {
    return false
  }
}

if (isExecutedDirectly()) {
  runCli(process.argv.slice(2)).then(exitCode => {
    process.exitCode = exitCode
  }).catch(error => {
    writeLine(process.stderr, `figma-ai-coder: ${redactError(error)}`)
    process.exitCode = 1
  })
}
