# Project rules for Figma AI Coder

This file belongs to this repository. `npx figma-ai-coder init` must not overwrite it after creation; any future updater must preserve the same ownership boundary.

Keep only stable, project-specific decisions here. The Agent must still verify component exports, props, and usages against the current checkout and report rules that appear stale.

## Project constraints

- Follow the repository's applicable `AGENTS.md`, `CLAUDE.md`, routing, state, accessibility, and testing conventions.
- Prefer the smallest change that satisfies the requested Figma page or component.

## Components

- Prefer existing project components whose exports and APIs are verified in source.
- Use native framework or HTML elements when no verified project abstraction fits.
- Do not create shared components solely from a guessed Figma name.

For stable mappings, add `rules/components/_catalog.md` and focused `rules/components/<component>.md` files, or use `adapter.json` for machine-readable mappings.

## Tokens and styling

- Reuse project semantic tokens and the established styling system when their meaning matches the design.
- Keep unresolved Figma values explicit and report them instead of inventing a token.

Add `rules/tokens.md` when the project needs token-specific guidance.

## Validation

- Use the repository's existing formatter, type check, tests, and build commands.
- Report validation that could not run and any design assets or business behavior that remain unresolved.
