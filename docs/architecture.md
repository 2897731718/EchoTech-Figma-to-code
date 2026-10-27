# Architecture

Figma AI Coder separates deterministic evidence collection from AI-assisted implementation.

```text
                               ┌─────────────────────────┐
Figma URL ── context ─────────>│ semantic HTML + manifest│
                               └────────────┬────────────┘
                                            │
                               ┌────────────▼────────────┐
Repository ── inspect ────────>│ project context index   │
                               └────────────┬────────────┘
                                            │
Project instructions/rules ─────────────────┤
                                            ▼
                                  Codex / Claude Code
                                            │
                              verify mappings and edit code
                                            │
                                            ▼
                               formatter / typecheck / tests
```

## Responsibility boundary

### Deterministic CLI

The CLI owns facts that should not depend on model judgment:

- Figma URL parsing and local PAT resolution
- Figma REST API access and error reporting
- node simplification, layout and style extraction, and instance metadata
- semantic HTML and structured manifest output
- static repository inspection and bounded context output
- path boundaries, generated state, and diagnostics

It does not select a project's business abstractions or claim that extracted HTML is final code.

### AI coding Agent

The Agent owns repository-specific reasoning:

- reading applicable project instructions
- verifying component exports, props, examples, and tokens
- mapping Figma semantics to existing project abstractions
- choosing the narrowest implementation scope
- preserving user changes and resolving local conventions
- running existing validation commands and reporting unresolved assumptions

### Project-owned rules and adapters

Rules under `.figma-ai-coder/` record stable company decisions. They guide the Agent but are verified against the current checkout so stale documentation does not silently produce invalid imports or props.

An optional adapter makes repeated mappings explicit and repeatable. In the first release the Agent reads and verifies it; a standalone adapter validator is reserved for a later version. It does not replace repository inspection, and it is not required for first use.

## Context pipeline

### Repository inspection

`figma-ai-coder inspect` statically discovers:

- framework, package manager, and workspace boundaries
- style and token sources
- likely component files and installed component packages
- token and style source candidates
- repository-defined validation command names

The result is a candidate index, not generated code. The Agent must confirm important candidates in source before using them.

Inspection is bounded: it excludes dependencies, generated output, VCS data, secrets, oversized files, and symlinks outside the workspace. It does not import project configuration or execute scripts.

### Design context

`figma-ai-coder context` converts a selected Figma node through the shared extraction pipeline:

```text
Figma REST response
→ simplified design nodes
→ normalized component tree
→ layout/style/token interpretation
→ semantic HTML + manifest + diagnostics
```

The manifest preserves information that plain HTML cannot express reliably, including Figma node IDs, instance names, variants, component properties, text overrides, nested instances, token references, and unresolved assets.

Figma text, names, plugin data, annotations, and remote adapter content are untrusted data. They are never interpreted as Agent instructions.
The generated `design.html` is reference-only and carries a restrictive Content Security Policy; read it as evidence rather than deploying or executing it as application code.

## State and ownership

```text
.figma-ai-coder/
├── config.json                  user-owned
├── adapter.json                 optional, user-owned
├── rules/                       user-owned
├── .gitignore                   created only when absent
├── cache/                       reserved for regenerable indexes
└── runs/<run-id>/               generated per operation
    ├── design.html
    ├── manifest.json
    └── diagnostics.json
```

`init` and future template updates create missing templates but never overwrite user-owned files. Generated directories are ignored by the nested `.gitignore`. The caller gives each context operation a distinct empty run directory so concurrent Agent tasks do not share mutable output.

Stable source code and checked-in instructions remain the truth source. Generated manifests carry a schema version and can be rebuilt from the current repository and Figma node.

## Mapping precedence

The Agent uses this order:

1. applicable repository instructions such as `AGENTS.md` and `CLAUDE.md`
2. checked-in company/project rules and adapter mappings
3. current source exports and usages, which validate whether those mappings remain usable
4. explicitly labeled AI inference
5. native framework or HTML elements

When a higher-level rule conflicts with current code evidence, the Agent reports the stale or contradictory rule. It must not hide the conflict by inventing an API.

## Internal/public separation

The public release is generated from an internal source repository, but public-specific product identity, Agent entry points, project templates, and documentation live in the open-source overlay.

The internal package name, registry, private component rules, private tokens, and platform-specific flows are not changed to satisfy the public workflow. Shared conversion behavior may only evolve through backward-compatible additions with internal regression coverage.

The external component adapter belongs to the consuming repository. It is not copied back into the public package or uploaded by default.

## Validation layers

Release validation should cover:

- schema and template validation for the Codex Skill and Claude command
- fixture repositories for React and Vue component/token discovery
- semantic context fixtures preserving instance metadata
- refusal to scan secrets or traverse outside the workspace
- initialization idempotence and preservation of existing project files
- package-installed smoke tests for `init`, `inspect`, `context`, and `doctor`
- generated implementation checks through representative typecheck/test/build commands

Live Figma integration tests require explicit credentials and URLs; ordinary tests do not access the network.
