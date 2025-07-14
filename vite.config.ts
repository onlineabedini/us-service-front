import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['vitago.se', 'www.vitago.se', 'dev.vitago.se', 'www.dev.vitago.se'],
  }
})
