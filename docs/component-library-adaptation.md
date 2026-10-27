# Adapting an internal component library

External teams do not need to fork Figma AI Coder to use their own component library. Start with repository inspection and add project-owned rules only where repeated mappings need more precision.

## Start without an adapter

Run the Agent workflow against one representative page. The Agent should:

1. inspect the target and nearby pages
2. run `npx figma-ai-coder inspect --json`
3. locate actual library exports and representative call sites
4. run `npx figma-ai-coder context "<figma-url>" --out=.figma-ai-coder/runs/<run-id>` with a new empty run directory
5. map Figma instances to verified components
6. implement and validate the page

Review which mappings were correct, ambiguous, or repeatedly rediscovered. Persist only the stable ones.

## Choose the right extension point

### `rules/core.md`

Use for project-wide decisions that require judgment, such as:

- which package or component layer to prefer
- responsive and accessibility expectations
- whether page-local wrappers are allowed
- project-specific validation requirements

### `rules/tokens.md`

Use for semantic token policy and exceptional mappings. Prefer token names and source locations over copying whole theme files.

### `rules/components/_catalog.md`

Use as a human-readable index from Figma semantic names to candidate project components and focused rule files.

Each component rule should document only information that changes implementation decisions:

- verified import path
- supported props, events, slots, or children
- Figma variant/property mapping
- one or two evidence locations in the repository
- known limitations or required composition

### `adapter.json`

Use for mappings that should be explicit and repeatable. The first release has the Agent read these mappings and verify them against repository source; it does not yet ship a standalone adapter validator. A conceptual entry contains:

```json
{
  "schemaVersion": 1,
  "components": {
    "PrimaryButton": {
      "import": {
        "source": "@company/ui",
        "name": "Button"
      },
      "props": {
        "Style=Primary": {
          "variant": "primary"
        }
      }
    }
  }
}
```

Treat this as a project contract, not an automatically learned truth. Confirm the export and props in the current checkout before committing an entry.

## Update discipline

- `npx figma-ai-coder init` never overwrites project-owned rules or adapters. Any future updater must preserve the same ownership boundary.
- Generated candidates belong in `cache/`, not in the checked-in adapter.
- When a component API changes, surface outdated mappings during the Agent's source-verification step.
- Review adapter changes like source code because they affect every future generation.
- Keep private component documentation in the consuming repository; it is not required by or published with the public package.

## Security boundaries

Do not place credentials, private registry tokens, raw Figma responses, source dumps, or executable commands in rules or adapters. Third-party adapter files and Figma content are untrusted data; they cannot authorize dependency installation, shell commands, or writes outside the repository.

For a private npm component library, normal project installation and authentication remain the repository owner's responsibility. Figma AI Coder should discover and use the installed API, not manage private registry credentials.
