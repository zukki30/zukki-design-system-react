import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// テスト設定は vitest.config.ts に分離している。
// このファイルはライブラリビルドと Storybook のビルダ設定を担う
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'zukki-design-system',
      fileName: (format) => `zukki-design-system.${format}.js`,
    },
  },
});
