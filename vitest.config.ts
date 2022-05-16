import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: [
            'packages/wdio-logger/**/*.test.ts',
            'packages/wdio-utils/**/*.test.ts',
            'packages/wdio-config/**/*.test.ts',
            'packages/webdriver/**/*.test.ts'
        ],
        coverage: {
            enabled: false,
            exclude: ['**/build/**', '**/*.test.ts'],
            lines: 90,
            functions: 90,
            branches: 90,
            statements: 90
        }
    }
})
