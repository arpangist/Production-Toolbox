import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves this repo from /Production-Toolbox/. `npm run preview`
  // mirrors that so it is a true production preview, while `npm run dev` stays
  // at the root for convenience.
  base: command === 'build' || isPreview ? '/Production-Toolbox/' : '/',
}))
