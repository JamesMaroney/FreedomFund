import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { execSync } from 'child_process'

const isProd = process.env.NODE_ENV === 'production'
const gitHash = execSync('git rev-parse HEAD').toString().trim().slice(0, 7)
const buildNumber = execSync('git rev-list --count HEAD').toString().trim()

// https://vite.dev/config/
export default defineConfig({
  base: isProd ? '/FreedomFund/' : '/',
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
  plugins: [
    !isProd && basicSsl(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Freedom Fund',
        short_name: 'Freedom',
        description: 'Pay yourself every time you skip a purchase',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
