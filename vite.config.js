import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    headers: {
      // Required for Google OAuth popup to communicate back via postMessage
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})


