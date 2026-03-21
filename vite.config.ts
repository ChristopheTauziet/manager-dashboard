import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Dev: serve from site root so http://localhost:5173/ works.
// Build: GitHub Pages needs the repo path as base.
const GH_PAGES_BASE = '/manager-dashboard/'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? GH_PAGES_BASE : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // If 5173 is taken (another tab, Cursor, etc.), Vite picks the next free port — use the URL it prints.
    port: 5173,
    strictPort: false,
    host: true,
  },
}))
