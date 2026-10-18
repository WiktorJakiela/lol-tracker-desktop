// Konfiguracja uruchamiania i budowania głównego procesu Electron, preload oraz interfejsu React.
// Ustawia też developerskie proxy do backendu, skrót @renderer i obsługę React przez Vite.

import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    server: {
      proxy: {
        // Tylko w development przekazujemy /api do Springa na 8080; to nie uruchamia backendu.
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
    resolve: {
      alias: {
        // Skrót w importach zamiast długich ścieżek względnych do katalogu renderera.
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
