/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60 * 3,
        exclude: ['./e2e/browser-runner', '**/node_modules/**'],
        include: ['./e2e/**/*.test.ts'],
        hookTimeout: 60 * 1000
    }
})
