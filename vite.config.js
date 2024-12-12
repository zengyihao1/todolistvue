import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue'],
          'ui': ['@headlessui/vue', '@heroicons/vue'],
          'utils': ['@vueuse/core', 'vue-toastification']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      '@vueuse/core',
      '@headlessui/vue',
      '@heroicons/vue',
      'vue-toastification'
    ]
  }
})
