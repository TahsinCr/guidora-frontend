import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
    // High-performance image optimization (WebP, PNG, JPEG, SVG)
    ViteImageOptimizer({
      png: { quality: 85 },
      jpeg: { quality: 85 },
      webp: { lossless: true },
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
              },
            },
          },
          'removeViewBox',
          'sortAttrs',
          {
            name: 'addAttributesToSVGElement',
            params: {
              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
          },
        ],
      },
    }),
    // Gzip pre-compression for production deployment
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Brotli pre-compression for maximum compression ratio
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Suppress legacy JS API deprecation warnings if any
          silenceDeprecations: ['legacy-js-api', 'if-function'],
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'query-vendor': ['@tanstack/react-query'],
            'icons-vendor': ['lucide-react'],
            'markdown-vendor': ['marked', 'dompurify'],
          },
        },
      },
    },
  };
});
