import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- DEBE ESTAR ESTO

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Y ESTO
  ],
})