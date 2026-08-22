# Repository Guidelines

## Communication

Respond in Japanese. Keep code, command names, and commit messages in their established English forms.

## Project Structure & Module Organization

This is a React/TypeScript component library built with Vite and Storybook:

- `src/components/ComponentName/` contains implementation, Vanilla Extract styles, stories, tests, and a barrel export.
- `src/hooks/` holds hooks shared across components (e.g. `useMergedRef`). Hooks used by a single component stay in `src/components/ComponentName/hooks/`. Shared hooks are internal: they are not exported from `src/main.tsx`.
- `src/styles/theme.css.ts` exports shared theme variables; generated CSS variables live in `src/styles/`.
- `src/design-tokens/` contains generated TypeScript token objects. Do not hand-edit generated output.
- `figma/tokens.json` is the Tokens Studio export; `style-dictionary/` transforms it.
- `test/setup.ts` configures the Vitest environment.

Export public APIs through component `index.ts` files and `src/main.tsx`.

Barrels are the public boundary only. Inside the library, import a sibling component from its implementation file (`../Icon/Icon`), not its barrel (`../Icon`), to avoid circular barrel references and pulling unrelated exports into the module graph. Stories and specs are exempt and may use the barrels. ESLint's `no-restricted-imports` enforces this.

## Available Agent Skills

The following skills are checked into the repository so the whole team can use them. Real files live in `.codex/skills/`; `.claude/skills/` holds relative symlinks to the same directories, so both Codex and Claude Code discover them. Apply them when their purpose matches the task.

> Note: the symlinks are stored as Git symlinks (mode `120000`). On Windows, ensure `git config core.symlinks true` (and Developer Mode / admin) so they resolve instead of checking out as text files.

- `react-best-practices` — React performance and implementation review.
- `web-design-guidelines` — UI, accessibility, and UX audits.
- `composition-patterns` — scalable React component APIs.
- `webapp-testing` — browser-based integration checks.
- `tdd` — behavior-focused red-green-refactor development.

## Build, Test, and Development Commands

The toolchain is pinned in `.mise.toml`: Node 24.14.1 and pnpm 10.33.0. Run `mise install` to set it up.

- `pnpm dev` — start Storybook on port 6006.
- `pnpm build` — type-check and create the Vite library bundle.
- `pnpm typecheck` — run `tsc -b` without bundling.
- `pnpm lint` — run ESLint with automatic fixes.
- `pnpm lint:check` — run ESLint without fixing (used by CI).
- `pnpm format` — format `src/**/*.ts(x)` with Prettier.
- `pnpm format:check` — verify formatting without writing (used by CI).
- `pnpm test` / `pnpm test:watch` — run Vitest once or interactively.
- `pnpm test:coverage` — produce V8 coverage reports.
- `pnpm token:transform && pnpm build:tokens` — regenerate token JSON, CSS, and TypeScript after updating Figma tokens.

## Coding Style & Naming Conventions

Use TypeScript function components and `type` aliases, never `interface` or `any`. Name components in PascalCase; use `ComponentName.tsx`, `ComponentName.css.ts`, `ComponentName.stories.tsx`, and `ComponentName.spec.tsx`. Use `ComponentPropsWithRef<'tag'>` for native props and `clsx()` for conditional classes.

Build multi-region components (header/body/footer) as compound components instead of `ReactNode` slot props. Express whether a part exists by rendering it, not with a `showXxx` boolean. Share values between parts through a context read with `use()`, typed as `state` / `actions` / `meta`, and throw from the context hook when it is called outside the provider. Hang the parts off the root (`Dialog.Header`) — the root is the one place that uses a function declaration, since arrow functions cannot carry properties. Export the context hook and its type so consumers can build their own parts. Behaviour flags that render nothing (`closeOnOverlayClick`) stay props on the root.

Put the context definition in `ComponentNameContext.ts` at the top level of the component directory — a context is a declaration of shared values, not a hook, so `hooks/` holds only logic hooks. Shared non-hook helpers live in `src/utils/` (`src/utils/dataAttribute.ts`), grouped by concern and imported directly like shared hooks, with no barrel and no export from `src/main.tsx`. Keep parts in `ComponentName.tsx` next to the root, except for parts that own a dedicated `.css.ts`, which get their own file alongside it (`StepsItem.tsx` / `StepsItem.css.ts`).

Spread `{...props}` **before** the internal attributes so the internal wiring wins; compound parts wire themselves together through `id` and `aria-*`, and silently overriding those produces confusing breakage. Destructure only the props consumers should be able to override and combine them with `??` (`role={role ?? (isLabelledGroup ? 'group' : undefined)}`). For props the root handles itself (`onClick`), call the consumer's handler first and then add the internal behaviour, leaving `event.defaultPrevented` as the opt-out.

Propagate root state (`disabled`, error) to child components that are not parts (`Input`, `Select`) by letting them read the context, not by injecting props with `cloneElement`. The child's own props win; the context only fills in what was left unspecified, and the hook for this must not throw when there is no provider, so the component still works standalone. Restrict `cloneElement` injection to attributes that are valid on a DOM element (`id`, `aria-*`, `disabled`), so a plain `<input>` child keeps working. Since the root cannot inspect nested children, have parts register their ids with the root and reflect them in `htmlFor` / `aria-describedby`; never emit an attribute pointing at an id that is not rendered.

Model mutually exclusive visual options as a named string union, not a boolean: `shape?: SkeletonShape` (`'rect' | 'circle'`) rather than `circle?: boolean`. Adding a third option then stays non-breaking, and the value maps directly onto `data-*` attributes and `styleVariants()` keys. Export the union type from the component and `src/main.tsx`. States that are genuinely binary (`disabled`, `loading`, `error`, `required`) stay boolean.

Follow React 19 ref-as-prop: accept `ref` as a regular prop and forward it to the component's main DOM element; never use `forwardRef`. `ComponentPropsWithRef` plus `{...props}` covers most components. When the component also needs the element itself, destructure `ref` and merge it with the internal ref via `useMergedRef`.

Write styles in Vanilla Extract with BEM-like class names, `styleVariants()`, and theme `vars`; do not hard-code design values. Format changed source before submitting.

## Testing Guidelines

Use Vitest and Testing Library in jsdom. Place `*.spec.tsx` beside components; cover exported behavior and conditional branches. Run `pnpm test` before opening a pull request.

## Commit & Pull Request Guidelines

Use concise English Conventional Commit-style subjects, e.g. `feat: add Tooltip component` or `fix: correct Dialog focus handling`. Common prefixes are `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, and `style`.

PRs should explain user-facing changes, link issues when available, include tests, and attach Storybook screenshots for visual changes. Call out token regeneration and breaking APIs.
