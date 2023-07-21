/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60,
        include: ['./e2e/**/*.test.ts'],
        hookTimeout: 60 * 1000,
        threads: false
    }
})
