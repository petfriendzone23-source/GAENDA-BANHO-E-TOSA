import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    envPrefix: ['VITE_', 'FIREBASE_'],
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        manifest: {
          name: 'Pet Friends Zone - Agendamento',
          short_name: 'PetFriends',
          description: 'Sistema moderno e completo para agendamento de banho e tosa para pet shops.',
          theme_color: '#00bcd4',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
