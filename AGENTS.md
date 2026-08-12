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

Follow React 19 ref-as-prop: accept `ref` as a regular prop and forward it to the component's main DOM element; never use `forwardRef`. `ComponentPropsWithRef` plus `{...props}` covers most components. When the component also needs the element itself, destructure `ref` and merge it with the internal ref via `useMergedRef`.

Write styles in Vanilla Extract with BEM-like class names, `styleVariants()`, and theme `vars`; do not hard-code design values. Format changed source before submitting.

## Testing Guidelines

Use Vitest and Testing Library in jsdom. Place `*.spec.tsx` beside components; cover exported behavior and conditional branches. Run `pnpm test` before opening a pull request.

## Commit & Pull Request Guidelines

Use concise English Conventional Commit-style subjects, e.g. `feat: add Tooltip component` or `fix: correct Dialog focus handling`. Common prefixes are `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, and `style`.

PRs should explain user-facing changes, link issues when available, include tests, and attach Storybook screenshots for visual changes. Call out token regeneration and breaking APIs.
