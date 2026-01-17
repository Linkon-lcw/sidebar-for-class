import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                settings: resolve(__dirname, 'settings.html'),
            },
        },
    },
    server: {
        port: 3000,
        strictPort: true,
    },
})
