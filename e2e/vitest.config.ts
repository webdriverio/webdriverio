/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60,
        include: [path.resolve(__dirname, '**', '*.test.ts')],
        hookTimeout: 60 * 1000,
        threads: false
    }
})
