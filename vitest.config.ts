import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            '@shared': path.resolve(__dirname, './shared'),
            '@entities': path.resolve(__dirname, './entities'),
            '@features': path.resolve(__dirname, './features'),
            '@widgets': path.resolve(__dirname, './widgets'),
        },
    },
})
