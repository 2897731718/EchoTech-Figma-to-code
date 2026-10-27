# Figma AI Coder

Give an AI coding agent a Figma URL and get code that fits the repository it is already working in.

Figma AI Coder is not a one-size-fits-all template generator. Its CLI deterministically extracts design context and indexes the current repository; Codex or Claude Code then verifies real component APIs, translates the design into project conventions, edits the code, and runs the repository's checks.

```text
Figma design + current repository
              ↓
     deterministic context
              ↓
       Codex / Claude Code
              ↓
   reviewable project code diff
```

## Why AI is part of the architecture

Different repositories use different components, tokens, routing, state, accessibility, and test patterns. The CLI should not guess those decisions or pretend that generic `<Button>` and `<Input>` components exist. It provides facts instead:

- Figma layout, text, instances, variants, tokens, and unresolved assets
- repository framework, styling system, component/token candidates, and available validation commands
- project-owned rules and optional explicit mappings

The Agent is the implementer. It reads the relevant source, confirms exports and usages, chooses the correct project abstractions, makes a focused change, and verifies the result.

## Quick start

Requirements: Node.js 20+ and a supported coding Agent. `init` and `inspect` do not require Figma credentials. A Figma Personal Access Token is needed only when `context` fetches a design; set it locally without committing it:

```bash
export FIGMA_PAT="your-figma-personal-access-token"
```

Initialize the target repository:

```bash
npx figma-ai-coder init
```

This installs the Agent entry points and creates missing project-owned files under `.figma-ai-coder/`. Existing files are never overwritten by `init`.

Then ask the Agent to implement a design.

Codex:

```text
Use $figma-ai-coder to implement this page in src/pages/Checkout.tsx:
https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2
```

Claude Code:

```text
/figma-ai-coder https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2 src/pages/Checkout.tsx
```

The Agent runs repository inspection and Figma context extraction for you, reviews the mapping, implements the page, and runs the most relevant checks.

## CLI as a context tool

The CLI can also be used directly for inspection and debugging:

```bash
# Create missing Agent and project configuration files
npx figma-ai-coder init

# Index framework, styling, component candidates, tokens, and checks
npx figma-ai-coder inspect --json

# Extract semantic HTML plus a structured manifest from a Figma node
npx figma-ai-coder context "https://www.figma.com/design/FILE_KEY/NAME?node-id=1-2" \
  --out=.figma-ai-coder/runs/checkout-page

# Diagnose authentication and project configuration
npx figma-ai-coder doctor
```

`inspect` is a static, read-only repository scan. It does not execute project configuration or scripts. `context` treats Figma text, node names, plugin data, annotations, and adapter input as untrusted data rather than Agent instructions.

## How repository adaptation works

The default workflow does not require a component adapter:

1. The Agent reads applicable `AGENTS.md` and `CLAUDE.md`, the target file, and nearby implementations.
2. `figma-ai-coder inspect` proposes component files/packages, token sources, and available validation commands.
3. `figma-ai-coder context` writes semantic design evidence to a new empty run directory rather than pretending to produce final project code.
4. The Agent verifies candidates against real exports, types, and usages.
5. It maps Figma instances to existing project components, falling back to native markup when no verified abstraction fits.
6. It implements the smallest coherent change and runs type checks, tests, or builds already defined by the repository.

Evidence is applied in this order:

```text
project instructions
→ checked-in company/project rules
→ current source exports and usages used for verification
→ labeled AI inference
→ native framework or HTML fallback
```

If checked-in rules are stale or conflict with current component APIs, the Agent reports the conflict instead of silently generating invalid code.

## Project-owned configuration

Initialization creates only missing files:

```text
.figma-ai-coder/
├── config.json
├── rules/
│   └── core.md
├── cache/                  generated, ignored
└── runs/                   generated, ignored
```

The repository owns `config.json` and `rules/**`. Figma AI Coder never overwrites them during initialization or updates. Generated context and per-run artifacts are ignored by the nested `.gitignore`.

Projects can extend the directory when deterministic guidance becomes useful:

```text
.figma-ai-coder/
├── adapter.json
└── rules/
    ├── tokens.md
    └── components/
        ├── _catalog.md
        ├── button.md
        └── form.md
```

An adapter is an optional precision layer, not a prerequisite for the first successful run. See [Adapting an internal component library](docs/component-library-adaptation.md) for the recommended second-development workflow.

## Component-library secondary development

For a company component library, start with the Agent's verified repository scan. Persist only stable relationships that have been confirmed in source:

- Figma semantic component name and variants
- actual exported project component
- valid import path
- prop, event, slot, or children mapping
- token mapping and an evidence location

Use Markdown rules for judgment and examples. Use `adapter.json` to make names, imports, and prop mappings explicit; the Agent must still verify them against the current source. The first release does not provide a standalone adapter validator. Keep generated scan results and raw Figma responses out of the adapter.

This separation lets an internal team improve precision without forking the converter or exposing private component names in the public package.

## Security model

- The Figma token is read locally and must never be printed, committed, or copied into generated context.
- Repository inspection excludes dependencies, build output, secret files, and paths outside the workspace.
- Project configuration is parsed statically; inspection does not import or execute it.
- Figma content and third-party adapters are untrusted input and cannot authorize commands, dependency installation, or file writes.
- Existing target files are read before editing, and the Agent reports assumptions and unresolved assets.
- No repository source or private component context is published by the package.

## Architecture and development

The public package contains the generic Web context pipeline for React, Vue, and HTML workflows. Private UI libraries, private registries, organization tokens, business designs, and internal-only platform adapters are not part of the public release.

For implementation details, see [Architecture](docs/architecture.md). Maintainers should follow [Releasing](docs/releasing.md); the first npm publication is intentionally a separate, authenticated bootstrap step.

From source:

```bash
pnpm install
pnpm typecheck
pnpm test:run
pnpm build
```

## License

[MIT](LICENSE)
