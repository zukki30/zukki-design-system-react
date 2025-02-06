import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'zukki-design-system',
      fileName: (format) => `zukki-design-system.${format}.js`,
    },
  },
});
