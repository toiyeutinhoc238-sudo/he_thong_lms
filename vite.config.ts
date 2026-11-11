import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BACKEND_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: false,
      host: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    }
  }
})
