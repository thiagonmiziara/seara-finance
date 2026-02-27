import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'logonova.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Seara Finance',
                short_name: 'SearaFinance',
                description: 'Gerencie suas finanças de forma simples e eficiente.',
                theme_color: '#1A1A1A',
                background_color: '#1A1A1A',
                icons: [
                    {
                        src: 'logonova.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'logonova.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'logonova.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
