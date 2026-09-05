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
    // 指定して切り替えることができなくなる（配布 CSS の要件）。
    // 対応ブラウザの下限を並べ、いずれかが未対応の構文は出力させない（README と揃えること）
    cssTarget: ['chrome123', 'safari17.5', 'firefox120'],
    lib: {
      entry: './src/main.tsx',
      // CJS は .cjs で出す。package.json が type: module なので、
      // .js のままだと Node が ESM として解釈し require() が中身を取り出せない
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'cjs' ? 'zukki-design-system.cjs' : 'zukki-design-system.js',
    },
    rollupOptions: {
      // React は利用側のものを使う。同梱すると二重に読み込まれ Invalid hook call になる
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
});
