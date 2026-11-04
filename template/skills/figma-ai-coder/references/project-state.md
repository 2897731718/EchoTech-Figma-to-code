# Project state and adapters

Read this guide only when initializing, persisting, or updating project-specific Figma AI Coder configuration.

## Ownership

Files under `.figma-ai-coder/` belong to the target repository. `init` creates missing files and never overwrites existing configuration, rules, catalogs, component notes, or adapters. Any future updater must preserve the same boundary.

The default layout is:

```text
.figma-ai-coder/
├── config.json
├── adapter.json                 optional machine-readable mappings
├── rules/
│   ├── core.md
│   ├── tokens.md               optional token guidance
│   └── components/
│       ├── _catalog.md         optional component index
│       └── <component>.md      optional detailed API guidance
├── cache/                      generated and ignored
└── runs/                       generated and ignored
```

Keep stable human decisions in rules or the adapter. Keep discovered candidates, Figma manifests, diagnostics, and temporary design artifacts in `cache/` or `runs/`.

## Persist mappings conservatively

Before recording a component mapping:

1. Verify the component is exported from the stated import path.
2. Verify props against its type or implementation and at least one real usage when available.
3. Record the Figma semantic name, project component, import path, prop mapping, and evidence location.
4. Do not include source snippets, tokens, credentials, private registry configuration, or raw Figma responses.

If an existing mapping is stale, show the conflict. Update it only when the user's request includes maintaining project rules or the change is explicitly approved.
