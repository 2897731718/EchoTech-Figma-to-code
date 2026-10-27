import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path'

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'target',
])

const SENSITIVE_FILE_NAMES = new Set([
  '.npmrc',
  '.pypirc',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'id_rsa',
  'npmrc',
])

const SENSITIVE_EXTENSIONS = new Set([
  '.cer',
  '.cert',
  '.crt',
  '.der',
  '.key',
  '.p12',
  '.pem',
  '.pfx',
])

const TEXT_EXTENSIONS = new Set([
  '.astro',
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.less',
  '.md',
  '.mjs',
  '.mts',
  '.scss',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
])

const TEXT_FILE_NAMES = new Set([
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
])

const COMPONENT_EXTENSIONS = new Set(['.astro', '.jsx', '.svelte', '.tsx', '.vue'])
const MAX_FILE_SIZE_BYTES = 512 * 1024
const MAX_FILES = 20_000
const MAX_CANDIDATES = 200

export interface ProjectInspection {
  schemaVersion: 'figma-ai-project/v1'
  projectRoot: '.'
  stack: {
    frameworks: string[]
    languages: string[]
    packageManager?: string
  }
  styles: {
    systems: string[]
    files: string[]
  }
  scripts: string[]
  componentCandidates: string[]
  componentPackages: string[]
  tokenCandidates: string[]
  stats: {
    scannedFiles: number
    skippedLargeFiles: number
    skippedSensitiveFiles: number
    skippedSymlinks: number
    parseErrors: number
    truncated: boolean
  }
}

interface ScanState {
  files: string[]
  scannedFiles: number
  skippedLargeFiles: number
  skippedSensitiveFiles: number
  skippedSymlinks: number
  parseErrors: number
  truncated: boolean
}

interface PackageMetadata {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  packageManager?: string
  scripts?: Record<string, string>
}

function toPortablePath(path: string): string {
  return path.split(sep).join('/')
}

function isWithinRoot(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

function isSensitiveFile(name: string): boolean {
  const lowerName = name.toLowerCase()
  return lowerName.startsWith('.env')
    || SENSITIVE_FILE_NAMES.has(lowerName)
    || SENSITIVE_EXTENSIONS.has(extname(lowerName))
  }

function walkProject(root: string): ScanState {
  const state: ScanState = {
    files: [],
    scannedFiles: 0,
    skippedLargeFiles: 0,
    skippedSensitiveFiles: 0,
    skippedSymlinks: 0,
    parseErrors: 0,
    truncated: false,
  }

  const walk = (directory: string): void => {
    if (state.truncated) return

    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      state.parseErrors += 1
      return
    }

    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (state.scannedFiles >= MAX_FILES) {
        state.truncated = true
        return
      }

      const absolutePath = resolve(directory, entry.name)
      if (!isWithinRoot(root, absolutePath)) continue

      let stat
      try {
        stat = lstatSync(absolutePath)
      } catch {
        state.parseErrors += 1
        continue
      }

      if (stat.isSymbolicLink()) {
        state.skippedSymlinks += 1
        continue
      }

      if (stat.isDirectory()) {
        const projectRelativePath = toPortablePath(relative(root, absolutePath))
        const isGeneratedFigmaAiState = projectRelativePath === '.figma-ai-coder/cache'
          || projectRelativePath === '.figma-ai-coder/runs'
        if (!EXCLUDED_DIRECTORIES.has(entry.name) && !isGeneratedFigmaAiState) walk(absolutePath)
        continue
      }

      if (!stat.isFile()) continue
      state.scannedFiles += 1

      if (isSensitiveFile(entry.name)) {
        state.skippedSensitiveFiles += 1
        continue
      }
      if (stat.size > MAX_FILE_SIZE_BYTES) {
        state.skippedLargeFiles += 1
        continue
      }

      const extension = extname(entry.name).toLowerCase()
      if (entry.name === 'package.json' || TEXT_FILE_NAMES.has(entry.name) || TEXT_EXTENSIONS.has(extension)) {
        state.files.push(toPortablePath(relative(root, absolutePath)))
      }
    }
  }

  walk(root)
  return state
}

function readSmallText(root: string, relativePath: string, state: ScanState): string | null {
  try {
    return readFileSync(resolve(root, relativePath), 'utf8')
  } catch {
    state.parseErrors += 1
    return null
  }
}

function addDetectedDependency(
  names: ReadonlySet<string>,
  dependency: string,
  target: Set<string>,
  label: string,
): void {
  if (names.has(dependency)) target.add(label)
}

/**
 * Inspect a repository using file metadata and small text files only.
 * Configuration files are never imported or executed, and symbolic links are
 * skipped entirely so inspection cannot escape the selected project root.
 */
export function inspectProject(projectRoot: string): ProjectInspection {
  const root = realpathSync(resolve(projectRoot))
  const state = walkProject(root)
  const frameworks = new Set<string>()
  const languages = new Set<string>()
  const styleSystems = new Set<string>()
  const styleFiles = new Set<string>()
  const scripts = new Set<string>()
  const dependencies = new Set<string>()
  const componentCandidates = new Set<string>()
  const componentPackages = new Set<string>()
  const tokenCandidates = new Set<string>()
  let packageManager: string | undefined

  for (const file of state.files) {
    const extension = extname(file).toLowerCase()
    const fileName = basename(file).toLowerCase()
    if (['.ts', '.tsx', '.mts'].includes(extension)) languages.add('typescript')
    if (['.js', '.jsx', '.mjs', '.cjs'].includes(extension)) languages.add('javascript')

    if (fileName === 'package.json') {
      const content = readSmallText(root, file, state)
      if (!content) continue
      try {
        const metadata = JSON.parse(content) as PackageMetadata
        for (const name of Object.keys({
          ...metadata.dependencies,
          ...metadata.devDependencies,
          ...metadata.peerDependencies,
        })) dependencies.add(name)
        for (const name of Object.keys(metadata.scripts ?? {})) scripts.add(name)
        if (!packageManager && metadata.packageManager) {
          packageManager = metadata.packageManager.split('@')[0]
        }
      } catch {
        state.parseErrors += 1
      }
      continue
    }

    if (extension === '.vue') frameworks.add('vue')
    if (extension === '.svelte') frameworks.add('svelte')
    if (extension === '.astro') frameworks.add('astro')
    if (/^tailwind\.config\./.test(fileName)) styleSystems.add('tailwindcss')
    if (/^(?:uno|unocss)\.config\./.test(fileName)) styleSystems.add('unocss')
    if (extension === '.tsx' || extension === '.jsx') {
      const content = readSmallText(root, file, state)
      if (content && /(?:from\s+['"]react['"]|jsx|React\.)/.test(content)) frameworks.add('react')
    }

    if (['.css', '.scss', '.less'].includes(extension)) {
      styleFiles.add(file)
      if (extension === '.scss') styleSystems.add('sass')
      if (extension === '.less') styleSystems.add('less')
      if (/\.module\.(?:css|scss|less)$/.test(fileName)) styleSystems.add('css-modules')

      const content = readSmallText(root, file, state)
      if (content && /(?:^|[\s{;])--[\w-]+\s*:/.test(content)) tokenCandidates.add(file)
    }

    if (COMPONENT_EXTENSIONS.has(extension)) {
      const segments = file.toLowerCase().split('/')
      const likelyComponentDirectory = segments.some(segment =>
        ['components', 'design-system', 'shared', 'ui'].includes(segment),
      )
      const likelyComponentName = /^[A-Z][A-Za-z0-9._-]*\./.test(basename(file))
      if (likelyComponentDirectory || likelyComponentName) componentCandidates.add(file)
    }

    if (/(?:^|\/)(?:design-)?tokens?(?:[./_-]|$)|(?:^|\/)(?:theme|variables|colors)(?:[./_-]|$)/i.test(file)) {
      tokenCandidates.add(file)
    }
  }

  addDetectedDependency(dependencies, 'react', frameworks, 'react')
  addDetectedDependency(dependencies, 'next', frameworks, 'nextjs')
  addDetectedDependency(dependencies, 'next', frameworks, 'react')
  addDetectedDependency(dependencies, 'vue', frameworks, 'vue')
  addDetectedDependency(dependencies, 'nuxt', frameworks, 'nuxt')
  addDetectedDependency(dependencies, 'nuxt', frameworks, 'vue')
  addDetectedDependency(dependencies, 'svelte', frameworks, 'svelte')
  addDetectedDependency(dependencies, 'astro', frameworks, 'astro')
  addDetectedDependency(dependencies, 'tailwindcss', styleSystems, 'tailwindcss')
  addDetectedDependency(dependencies, 'unocss', styleSystems, 'unocss')
  addDetectedDependency(dependencies, '@unocss/core', styleSystems, 'unocss')
  addDetectedDependency(dependencies, 'styled-components', styleSystems, 'styled-components')
  addDetectedDependency(dependencies, '@emotion/react', styleSystems, 'emotion')
  addDetectedDependency(dependencies, 'sass', styleSystems, 'sass')
  addDetectedDependency(dependencies, 'less', styleSystems, 'less')
  if (styleFiles.size > 0) styleSystems.add('css')

  const knownComponentPackages = [
    '@chakra-ui/react',
    '@fluentui/react',
    '@headlessui/react',
    '@mantine/core',
    '@mui/material',
    '@radix-ui/react-slot',
    'antd',
    'element-plus',
  ]
  for (const dependency of dependencies) {
    if (knownComponentPackages.includes(dependency)
      || /(?:^|\/)(?:components|design-system|ui)(?:-|$)/i.test(dependency)) {
      componentPackages.add(dependency)
    }
  }

  if (!packageManager) {
    if (state.files.includes('pnpm-lock.yaml')) packageManager = 'pnpm'
    else if (state.files.includes('yarn.lock')) packageManager = 'yarn'
    else if (state.files.includes('bun.lock') || state.files.includes('bun.lockb')) packageManager = 'bun'
    else if (state.files.includes('package-lock.json')) packageManager = 'npm'
  }

  const sortedLimited = (values: Set<string>): string[] =>
    [...values].sort((a, b) => a.localeCompare(b)).slice(0, MAX_CANDIDATES)

  return {
    schemaVersion: 'figma-ai-project/v1',
    projectRoot: '.',
    stack: {
      frameworks: sortedLimited(frameworks),
      languages: sortedLimited(languages),
      ...(packageManager ? { packageManager } : {}),
    },
    styles: {
      systems: sortedLimited(styleSystems),
      files: sortedLimited(styleFiles),
    },
    scripts: sortedLimited(scripts),
    componentCandidates: sortedLimited(componentCandidates),
    componentPackages: sortedLimited(componentPackages),
    tokenCandidates: sortedLimited(tokenCandidates),
    stats: {
      scannedFiles: state.scannedFiles,
      skippedLargeFiles: state.skippedLargeFiles,
      skippedSensitiveFiles: state.skippedSensitiveFiles,
      skippedSymlinks: state.skippedSymlinks,
      parseErrors: state.parseErrors,
      truncated: state.truncated,
    },
  }
}
