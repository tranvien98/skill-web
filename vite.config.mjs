import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, transformWithOxc } from 'vite';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

// Giống owlla_frontend: component viết JSX trong file .js
function transformJsxInJavaScript() {
  return {
    name: 'owllee-jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      const filename = id.split('?')[0];
      if (!filename.includes('/src/') || !filename.endsWith('.js')) {
        return null;
      }
      return transformWithOxc(code, filename, { lang: 'jsx' });
    },
  };
}

export default defineConfig(({ mode }) => {
  const environment = { ...loadEnv(mode, rootDirectory, ''), ...process.env };
  const target = environment.DEV_PROXY_TARGET;

  return {
    plugins: [transformJsxInJavaScript(), react({ include: /\.(js|jsx)$/ })],
    resolve: {
      alias: {
        '@constant': path.resolve(rootDirectory, 'src/constants/constant.js'),
        '@link': path.resolve(rootDirectory, 'src/constants/link.js'),
        '@api': path.resolve(rootDirectory, 'src/constants/api.js'),
        '@src': path.resolve(rootDirectory, 'src'),
        '@app': path.resolve(rootDirectory, 'src/app'),
        '@component': path.resolve(rootDirectory, 'src/app/component'),
        '@services': path.resolve(rootDirectory, 'src/app/services'),
        '@common': path.resolve(rootDirectory, 'src/common'),
      },
    },
    css: {
      preprocessorOptions: { scss: { api: 'modern-compiler' } },
    },
    server: {
      port: 5180,
      // Auth bằng cookie: đi qua proxy để cookie cùng origin với trang
      proxy: target ? {
        '/api': { target, changeOrigin: true, secure: false },
      } : undefined,
    },
  };
});
