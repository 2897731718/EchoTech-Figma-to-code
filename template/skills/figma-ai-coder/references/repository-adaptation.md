# Repository adaptation

Use this guide when the target repository has a component library, design tokens, unusual framework conventions, or multiple plausible component mappings.

## Build an evidence-backed context

Start with the target and its neighbors, then widen the search only as needed:

- Inspect `package.json`, the active lockfile, framework and build configuration, path aliases, routing, and style configuration.
- Locate public component entry points and barrel exports before reading implementation internals.
- Find two or three real call sites for each likely component. Confirm its import path, required props, controlled/uncontrolled behavior, slots or children, events, and styling hooks.
- Locate token definitions and usages. Prefer an existing semantic token over copying a raw Figma value when the visual meaning matches.
- Reuse the repository's loading, empty, error, responsive, accessibility, and test patterns when the requested UI needs them.

Do not scan generated output, vendored dependencies, coverage, secret files, or unrelated applications in a monorepo. `inspect` results are candidates, not permission to read the whole repository.

## Make the mapping explicit

For each meaningful Figma instance, establish:

| Evidence | Decision |
| --- | --- |
| Figma semantic name and properties | Intended visual role and variants |
| Export declaration | Valid project component and import path |
| Existing usages | Supported props, composition, and conventions |
| Project rules or adapter | Company-preferred mapping |
| Nearby target code | Local naming, state, and layout pattern |

Keep the mapping in working notes unless the user asks to persist it. Low-confidence matches should fall back to native markup or be surfaced to the user; they should not be written into a shared adapter automatically.

## Translate, do not paste

- The semantic HTML preserves design structure; it is not intended to compile unchanged.
- Replace design-only instance names with verified project imports.
- Preserve layout intent while following the project's responsive and styling system.
- Keep literal copy from the design unless the repository establishes i18n or content bindings.
- Use placeholders for unresolved images or business data and report them.
- Create a reusable component only when repository precedent or repeated structure justifies it.

After implementation, inspect the diff and verify that every introduced import and prop exists in the current checkout.
