import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const localFontsRoot = fileURLToPath(new URL('../fonts', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  server: {
    fs: {
      allow: [projectRoot, localFontsRoot],
    },
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
