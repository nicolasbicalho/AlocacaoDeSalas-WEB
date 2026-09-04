import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3100,
    // host: true permite acessar o dev server de fora do container (necessário quando o WEB roda no Docker).
    // No host é inofensivo — continua acessível em http://localhost:3100.
    host: true,
    watch: {
      // Polling só é necessário quando o Vite roda dentro do container (file-watching Windows -> Linux).
      // Ativado via env no compose; no host fica desligado para não pesar.
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
  },
})
