import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * ストーリーを実ブラウザで実行し、axe-core で a11y を検査するプロジェクト。
 *
 * 配色は `light-dark()` で定義されており、その解決は `prefers-color-scheme` に従う。
 * 配色ごとに検査したいため、Playwright 側でエミュレートしたプロジェクトを分けて用意する。
 */
const storybookProject = (name: string, colorScheme: 'light' | 'dark') => ({
  extends: './vite.config.ts',
  plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
  test: {
    name,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { colorScheme } }),
      instances: [{ browser: 'chromium' as const }],
    },
  },
});

export default defineConfig({
  test: {
    // カバレッジはプロジェクト単位では指定できないためルートに置く
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/'],
    },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          css: true,
          exclude: [...configDefaults.exclude, 'e2e/*'],
        },
      },
      storybookProject('a11y-light', 'light'),
      storybookProject('a11y-dark', 'dark'),
    ],
  },
});
