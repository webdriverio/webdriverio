import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['packages/wdio-logger/**/*.test.ts'],
        coverage: {
            enabled: true,
            exclude: ['**/build/**', '**/*.test.ts'],
            lines: 90,
            functions: 90,
            branches: 90,
            statements: 90
        }
    }
})
