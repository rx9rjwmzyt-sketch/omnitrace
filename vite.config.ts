import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'OmniTrace Systems',
        short_name: 'OmniTrace',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg', // On changera l'icône plus tard
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})