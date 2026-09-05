import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// テスト設定は vitest.config.ts に分離している。
// このファイルはライブラリビルドと Storybook のビルダ設定を担う
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
    // 型宣言を出力する。src は @/ エイリアスを多用しており、素の tsc では
    // .d.ts の中にエイリアスがそのまま残って利用側から解決できないため、
    // 相対パスへ書き換えてくれるこのプラグインを使う
    dts({ tsconfigPath: './tsconfig.build.json' }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  // ライブラリの成果物に public/ の中身を混ぜない
  publicDir: false,
  build: {
    // light-dark() をポリフィルへ変換させない。
    // ポリフィルは prefers-color-scheme にしか反応せず、要素に color-scheme を
    // 指定して切り替えることができなくなる（配布 CSS の要件）
    cssTarget: 'chrome123',
    lib: {
      entry: './src/main.tsx',
      name: 'zukki-design-system',
      fileName: (format) => `zukki-design-system.${format}.js`,
    },
    rollupOptions: {
      // React は利用側のものを使う。同梱すると二重に読み込まれ Invalid hook call になる
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          // 指定しないと MISSING_GLOBAL_NAME の警告が出る
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
});
