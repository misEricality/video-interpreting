import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
  server: {
    port: 5173,
    proxy: {
      // 本地开发时,把 /api 代理到本地代理服务器(8799)
      // (原为 8788,因与其他项目冲突改为 8799)
      // 用 127.0.0.1 而非 localhost,避免 Windows 下 localhost 优先解析到 IPv6(::1)导致 ECONNREFUSED
      '/api': {
        target: 'http://127.0.0.1:8799',
        changeOrigin: true,
      },
    },
  },
});