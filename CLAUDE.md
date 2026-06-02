# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Storybook on port 6006)
pnpm dev

# Build (TypeScript compile + Vite bundle)
pnpm build

# Lint & format
pnpm lint
pnpm format

# Tests
pnpm test           # Single run
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage report

# Design tokens (Figma → CSS variables → TypeScript)
pnpm token:transform   # Figma export → JSON
pnpm build:tokens      # JSON → CSS + TypeScript files
```

## Architecture

This is a **React component library** (design system) built with TypeScript and Vanilla Extract CSS-in-JS. Components are documented and developed via Storybook.

**Tech stack:** React 19, TypeScript 5, Vite 6, Vanilla Extract, Vitest, Storybook 9

**Library entry point:** `src/main.tsx` exports all components. Vite builds to UMD + ES modules (`zukki-design-system.umd.js`, `zukki-design-system.es.js`).

**Design token pipeline:** Figma (tokens.json) → `pnpm token:transform` → `style-dictionary/tokens/*.json` → `pnpm build:tokens` → `src/design-tokens/*.ts` + global CSS variables in `src/styles/theme.css.ts`.

All component styles reference CSS variables via the `vars` object exported from `src/styles/theme.css.ts`.

## Component Structure

Each component lives in `src/components/ComponentName/` with this layout:

```
ComponentName/
├── hooks/                    # Optional: custom hooks
│   ├── useComponentName.ts
│   ├── useComponentName.spec.ts
│   └── index.ts
├── ComponentName.tsx         # Component implementation
├── ComponentName.stories.tsx # Storybook stories
├── ComponentName.css.ts      # Vanilla Extract styles
└── index.ts                  # Barrel export
```

## Coding Conventions

**TypeScript/React:**
- Functional components only: `export const ComponentName = ({ ...props }: Props) => { ... }`
- Use `type` (not `interface`) for all type definitions; never use `any`
- Use `ComponentPropsWithoutRef<'tag'>` to spread native HTML attributes
- Use `clsx()` for conditional className merging
- Minimal `useEffect` usage; prefer declarative patterns
- Avoid deep `if/else` nesting; use `switch` for multiple conditions

**Styling (Vanilla Extract):**
- All styles in `ComponentName.css.ts` using `@vanilla-extract/css`
- BEM naming for class selectors
- Use `vars` from `src/styles/theme.css.ts` for all values (no hardcoded colors/spacing)
- Use `styleVariants()` for component variants

**Testing:**
- Test all exported functions; cover both branches of `if/else` and all cases of `switch`
- Test files: `*.spec.ts` or `*.test.ts`

**Git commits:**
- English messages with prefix: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `ci`, `perf`, `revert`

**Path alias:** `@/*` resolves to `src/*`
