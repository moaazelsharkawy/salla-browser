import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico','icons/icon-16.png','icons/icon-32.png','icons/icon-48.png','icons/salla-browser-96.png',
        'icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','og/salla-browser-og.png'
      ],
      manifest: {
        id: '/',
        name: 'Salla Browser',
        short_name: 'Salla Browser',
        description: 'متصفح تطبيقات منظومة Salla وWeb3',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#0a1320',
        background_color: '#0a1320',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        categories: ['productivity','utilities','shopping'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  server: { host: true, port: 5173 }
});
