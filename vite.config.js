import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'LEI Report Panel',
        short_name: 'LEI Report',
        description: 'Professional Work Report Generator for Laser Expert India',
        theme_color: '#6366f1'
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  base: '/',
})
