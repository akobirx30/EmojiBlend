import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/EmojiBlend/',            // если хочешь deploy на GitHub Pages
  plugins: [react()],
})
