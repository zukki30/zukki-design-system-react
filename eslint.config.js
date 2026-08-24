import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'index.html'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': eslintPluginJsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // React は名前空間ごと参照せず named import で使う。
      // React.ReactNode のような参照は @types/react の UMD グローバル宣言経由で
      // import なしでも型が通ってしまい、暗黙のグローバル依存になる。
      'no-restricted-syntax': [
        'error',
        {
          // 型注釈: React.ReactNode / React.ReactElement など
          selector: 'TSQualifiedName[left.name="React"]',
          message:
            "React 名前空間ではなく named import を使ってください（例: import type { ReactNode } from 'react'）",
        },
        {
          // 値: React.useState など
          selector: 'MemberExpression[object.name="React"]',
          message:
            "React 名前空間ではなく named import を使ってください（例: import { useState } from 'react'）",
        },
        {
          // JSX: <React.Fragment> など。JSX は MemberExpression と別ノードになる
          selector: 'JSXMemberExpression[object.name="React"]',
          message:
            "React 名前空間ではなく named import を使ってください（例: import { Fragment } from 'react'）",
        },
      ],
    },
  },
  {
    // ライブラリのエントリポイントは再 export しかしないため、
    // Fast Refresh（コンポーネント以外を export しない）の制約は当てはまらない
    files: ['src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // コンポーネント間の参照は barrel（index.ts）ではなく実装ファイルを直接 import する。
    // stories / spec は配布物に含まれないため、利用者と同じ barrel 経由を許容する。
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/components/**/*.{stories,spec}.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // 末尾が PascalCase の 1 セグメントで終わるパス（= コンポーネントの barrel）だけを対象にする。
              // group では barrel をディレクトリとして扱ってしまい ../Icon/Icon も巻き込むため regex を使う。
              regex: '^(\\.\\./)+[A-Z][A-Za-z0-9]*$|^@/components/[A-Z][A-Za-z0-9]*$',
              message:
                'コンポーネント間は barrel ではなく実装ファイルを直接 import してください（例: ../Icon/Icon）',
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier
);
