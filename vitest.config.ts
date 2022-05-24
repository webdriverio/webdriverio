import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['packages/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'dist', '.idea', '.git', '.cache',
            '**/node_modules/**',
            'packages/eslint-plugin-wdio/**/*',
            'packages/wdio-cli/**/*.test.ts',
            'packages/webdriverio/**/*.test.ts',
            'packages/wdio-devtools-service/**/*.test.ts',
            'packages/wdio-jasmine-framework/**/*.test.ts',
            'packages/wdio-mocha-framework/**/*.test.ts'
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
