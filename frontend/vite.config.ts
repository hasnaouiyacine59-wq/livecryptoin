import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/chart': 'http://localhost:8000',
      '/trades': 'http://localhost:8000',
      '/token': 'http://localhost:8000',
      '/pairs': 'http://localhost:8000',
      '/search': 'http://localhost:8000',
      '/trending': 'http://localhost:8000',
      '/portfolio': 'http://localhost:8000',
      '/swap': 'http://localhost:8000',
      '/chains': 'http://localhost:8000',
    },
  },
})
