# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Figma design-to-code **skeleton extractor** — not a direct code generator. It extracts layout structure, spacing, and component instance names from Figma via REST API, producing intermediate HTML skeletons that IDE AI (Claude/Cursor) then translates into real project code using project-specific rules in `.claude/figma-context.md`.

Published as `figma-to-code` to GitLab Package Registry (npm registry).

## Commands

```bash
pnpm install              # Install dependencies (pnpm 10.17+, Node 20.19+)
pnpm build                # Build with tsdown → dist/ (ESM, ES2022)
pnpm test                 # Run tests in watch mode (vitest)
pnpm test:run             # Run tests once
pnpm test:run tests/converter.test.ts   # Run a single test file
pnpm typecheck            # Type-check without emitting

# Integration test (requires real Figma PAT + URL)
FIGMA_URL="https://www.figma.com/design/xxx/...?node-id=123-456" pnpm test:run tests/integration.test.ts

# Local development with other projects
pnpm link --global        # Make CLI available globally
figma-to-code init --ui=your-ui-lib   # Init in a target project
```

## Architecture

Two entry points: library (`src/index.ts`) and CLI (`bin/cli.ts`).

**Processing pipeline:**
```
Figma REST API → raw node tree → simplifyNode() (denoise) → buildComponentTree() → generator (vue/html/react) → skeleton code
```

**i18n support:** TEXT nodes bound to Figma Variables (via lemon i18n platform) are auto-detected and output as `{{ t('key') }}`. Requires the `i18n Variable Exporter` Figma plugin to be run once per file (see ARCHITECTURE.md § i18n).

**Three denoising strategies** applied in sequence (see ARCHITECTURE.md for details):
1. INSTANCE nodes: children stripped — only name + dimensions kept
2. Pass-through containers: single-child wrappers with no visual styles collapsed
3. Width auto-detection: child width ≈ parent content width → omit fixed width

**Key modules:**
- `src/api/` — Figma REST API client + type definitions
- `src/converter/index.ts` — main `convertFigmaToCode()` orchestrator, includes `simplifyNode()` and `buildComponentTree()`
- `src/converter/tree-builder.ts` — Figma node → `ComponentNode` tree conversion
- `src/converter/layout.ts` — Auto Layout → flex CSS
- `src/converter/styles.ts` — fills/strokes/corners → CSS
- `src/converter/colors.ts` — RGB/RGBA/hex color conversion
- `src/converter/unocss/` — CSS property → UnoCSS utility class mapping
- `src/converter/styles/` — style output modes (css-converter, unocss-converter, inline-converter)
- `src/converter/generators/` — framework output (vue, html, react)
- `src/pat/reader.ts` — PAT resolution: `.env.local` → macOS Keychain → env var
- `figma-plugin/` — Figma plugin for exporting i18n Variable mappings to `sharedPluginData`
- `bin/cli.ts` — CLI with `init` subcommand and skeleton generation

**Template system:** `template/` contains `figma-context.md` variants (generic, your-ui-lib) copied by `init` into target project's `.claude/`.

## Skills (slash commands)

- `/figma <url> [path]` — Generate Vue component from Figma link (calls CLI → reads context → translates)
- `/figma-init` — Scan project to auto-generate `.claude/figma-context.md`
- `/publish [patch|minor|major] [beta]` — Publish to GitLab registry

## Figma PAT Resolution Order

1. `.env.local` (`FIGMA_PAT=`)
2. macOS Keychain (service: `FIGMA_PAT_GLOBAL` or `FIGMA_PAT`)
3. Environment variable `FIGMA_PAT`

## Conventions

- Language: TypeScript (strict mode, ESM only, `verbatimModuleSyntax`)
- Build: tsdown (rolldown-based), outputs to `dist/`
- Tests: vitest, files in `tests/` directory, config in `vitest.config.ts`
- Zero runtime dependencies — all `dependencies` in package.json is empty
- Commit messages in Chinese, prefixed with `feat:` / `fix:` etc.
