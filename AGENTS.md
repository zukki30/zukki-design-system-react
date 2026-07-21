# Repository Guidelines

## Communication

Respond to repository users in Japanese. Keep code, command names, and commit messages in their established English forms unless the task requires otherwise.

## Project Structure & Module Organization

This is a React/TypeScript component library built with Vite and documented in Storybook. Source lives in `src/`:

- `src/components/ComponentName/` contains a component, its Vanilla Extract stylesheet, Storybook story, tests, and barrel export.
- `src/styles/theme.css.ts` exports shared theme variables; generated CSS variables live in `src/styles/`.
- `src/design-tokens/` contains generated TypeScript token objects. Do not hand-edit generated output.
- `figma/tokens.json` is the Tokens Studio export; `style-dictionary/` transforms it into library tokens.
- `test/setup.ts` configures the Vitest environment.

Keep public exports wired through the component `index.ts` and `src/main.tsx`.

## Build, Test, and Development Commands

Use the pinned toolchain: Node 20.18.2 and pnpm 10.33.0.

- `pnpm dev` — start Storybook on port 6006.
- `pnpm build` — type-check and create the Vite library bundle.
- `pnpm lint` — run ESLint with automatic fixes.
- `pnpm format` — format `src/**/*.ts(x)` with Prettier.
- `pnpm test` / `pnpm test:watch` — run Vitest once or interactively.
- `pnpm test:coverage` — produce V8 coverage reports.
- `pnpm token:transform && pnpm build:tokens` — regenerate token JSON, CSS, and TypeScript after updating Figma tokens.

## Coding Style & Naming Conventions

Use TypeScript function components and `type` aliases (not `interface` or `any`). Name components in PascalCase, files as `ComponentName.tsx`, styles as `ComponentName.css.ts`, stories as `ComponentName.stories.tsx`, and tests as `ComponentName.spec.tsx`. Use `ComponentPropsWithoutRef<'tag'>` for native props and `clsx()` for conditional classes.

Write styles in Vanilla Extract. Use BEM-like class names, `styleVariants()` for variants, and theme `vars` rather than hard-coded color, spacing, or typography values. ESLint enforces React Hooks and accessibility rules; format changed source before submitting.

## Testing Guidelines

Use Vitest with Testing Library in the jsdom environment. Place focused tests beside the component as `*.spec.tsx`; cover exported behavior and every conditional branch. Run `pnpm test` before opening a pull request, and use coverage when changing nontrivial behavior.

## Commit & Pull Request Guidelines

Use concise English Conventional Commit-style subjects, e.g. `feat: add Tooltip component` or `fix: correct Dialog focus handling`. Common prefixes are `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, and `style`.

PRs should explain the user-facing change, link the relevant issue when available, include tests, and attach Storybook screenshots for visual changes. Call out token regeneration or breaking API changes explicitly.
