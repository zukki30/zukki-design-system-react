import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { transform } from 'esbuild';
import type { Plugin } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * `*.module.css` の入れ子を展開してから jsdom へ渡す。
 *
 * jsdom の CSS パーサは入れ子に未対応で、`&` を含むスタイルシートを **丸ごと捨てる**
 * （"Could not parse CSS stylesheet" を出して以降そのファイルの規則が一切効かなくなる）。
 * getComputedStyle で当たり方を確かめているテストが、
 * 「スタイルが当たらない」ことを期待する側だけ黙って通ってしまうため、ここで展開する。
 *
 * 展開に使うターゲットは chrome111。入れ子（Chrome 112）の 1 つ手前で、
 * `:has()`（Chrome 105）は残る組み合わせになる。展開しても `:is()` は挟まれず、
 * 詳細度は入れ子のときと同じままになる。
 * 対象を `*.module.css` に絞るのは、`variables*.css` の `light-dark()`（Chrome 123）まで
 * 変換させないため。ブラウザで動く a11y のプロジェクトと配布物は入れ子のまま扱う
 */
const flattenCssNestingForJsdom = (): Plugin => ({
  name: 'flatten-css-nesting-for-jsdom',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.includes('.module.css')) {
      return null;
    }

    const { code: flattened } = await transform(code, {
      loader: 'css',
      target: ['chrome111'],
      sourcefile: id,
    });

    return flattened;
  },
});

/**
 * ストーリーを実ブラウザで実行し、axe-core で a11y を検査するプロジェクト。
 *
 * 配色は `light-dark()` で定義されており、解決には `color-scheme` の宣言が要る。
 * preview の decorator が theme グローバルに応じてルート要素のクラスを付け替えるため、
 * 配色ごとに `initialGlobals` を変えたプロジェクトを用意する。
 * ツールバー操作と同じ経路を通るので、Storybook 上の見た目と検査対象が一致する。
 */
const storybookProject = (name: string, theme: 'light' | 'dark') => ({
  extends: './vite.config.ts',
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
      initialGlobals: { theme },
    }),
  ],
  test: {
    name,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
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
        plugins: [flattenCssNestingForJsdom()],
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
