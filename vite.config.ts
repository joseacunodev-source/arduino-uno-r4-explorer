import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import deployment from './vercel.json'

export default defineConfig({
  plugins: [react()],
  base: './',
  preview: { headers: Object.fromEntries(deployment.headers[0].headers.map(({ key, value }) => [key, value])) },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-engine': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    chunkSizeWarningLimit: 850,
  },
})
